"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import argon2 from "argon2";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

const updateDefaultCurrencySchema = z.object({
  currency: z.string().min(1).max(10),
});

export async function updateDefaultCurrency(input: unknown) {
  const userId = await requireUserId();
  const data = updateDefaultCurrencySchema.parse(input);

  await prisma.user.update({
    where: { id: userId },
    data: { defaultCurrency: data.currency },
  });

  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

export async function getUserSettings() {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { defaultCurrency: true },
  });
  return user;
}

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function updateProfile(input: unknown) {
  const userId = await requireUserId();
  const data = updateProfileSchema.parse(input);

  await prisma.user.update({
    where: { id: userId },
    data: { name: data.name },
  });

  revalidatePath("/", "layout");
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});

export async function changePassword(input: unknown) {
  const userId = await requireUserId();
  const data = changePasswordSchema.parse(input);

  // Defense-in-depth against a hijacked session brute-forcing the current
  // password: same rate limiter used for login/registration.
  const { allowed } = checkRateLimit(`changepw:${userId}`, {
    capacity: 5,
    refillIntervalMs: 60_000,
  });
  if (!allowed) {
    throw new Error("Слишком много попыток, попробуйте позже");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user.passwordHash || !(await argon2.verify(user.passwordHash, data.currentPassword))) {
    throw new Error("Неверный текущий пароль");
  }

  const passwordHash = await argon2.hash(data.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}
