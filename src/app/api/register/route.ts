import { NextResponse } from "next/server";
import argon2 from "argon2";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { allowed } = checkRateLimit(`register:${ip}:${email}`, {
    capacity: 3,
    refillIntervalMs: 20 * 60_000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Слишком много попыток, попробуйте позже" },
      { status: 429 },
    );
  }

  // Hashed unconditionally (not just on the success path) so a duplicate-email
  // response takes roughly the same time as a successful one — closing the
  // cheap timing side-channel that a short-circuiting existence check would open.
  const passwordHash = await argon2.hash(password);

  try {
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, email: true, name: true },
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Same status/shape as any other validation-style failure — doesn't
      // reveal whether the email is already registered.
      return NextResponse.json(
        { error: "Не удалось создать аккаунт. Проверьте данные или попробуйте войти." },
        { status: 400 },
      );
    }
    throw err;
  }
}
