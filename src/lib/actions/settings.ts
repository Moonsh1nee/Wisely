"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
}

export async function getUserSettings() {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { defaultCurrency: true },
  });
  return user;
}
