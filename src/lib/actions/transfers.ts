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

const createTransferSchema = z
  .object({
    fromAccountId: z.string(),
    toAccountId: z.string(),
    amount: z.coerce.number().positive("Сумма должна быть больше нуля"),
    description: z.string().max(500).optional(),
    date: z.coerce.date(),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: "Счёт-источник и счёт-назначение должны различаться",
    path: ["toAccountId"],
  });

export async function createTransfer(input: unknown) {
  const userId = await requireUserId();
  const data = createTransferSchema.parse(input);

  const fromAccount = await prisma.financialAccount.findFirst({
    where: { id: data.fromAccountId, userId },
  });
  if (!fromAccount) throw new Error("Счёт-источник не найден");

  const toAccount = await prisma.financialAccount.findFirst({
    where: { id: data.toAccountId, userId },
  });
  if (!toAccount) throw new Error("Счёт-назначение не найден");

  const transfer = await prisma.transfer.create({
    data: {
      userId,
      fromAccountId: data.fromAccountId,
      toAccountId: data.toAccountId,
      amountCents: Math.round(data.amount * 100),
      currency: fromAccount.currency,
      description: data.description,
      date: data.date,
    },
  });

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return transfer;
}

export async function deleteTransfer(transferId: string) {
  const userId = await requireUserId();
  await prisma.transfer.deleteMany({ where: { id: transferId, userId } });
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}
