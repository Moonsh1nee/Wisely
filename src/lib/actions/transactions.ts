"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

const createTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().positive("Сумма должна быть больше нуля"),
  currency: z.string().min(1).max(10).default("USD"),
  categoryId: z.string().optional().nullable(),
  description: z.string().max(500).optional(),
  date: z.coerce.date(),
});

export async function createTransaction(input: unknown) {
  const userId = await requireUserId();
  const data = createTransactionSchema.parse(input);

  const transaction = await prisma.transaction.create({
    data: {
      userId,
      type: data.type as TransactionType,
      amountCents: Math.round(data.amount * 100),
      currency: data.currency,
      categoryId: data.categoryId || null,
      description: data.description,
      date: data.date,
    },
  });

  revalidatePath("/dashboard");
  return transaction;
}

export async function deleteTransaction(transactionId: string) {
  const userId = await requireUserId();
  await prisma.transaction.deleteMany({ where: { id: transactionId, userId } });
  revalidatePath("/dashboard");
}

export async function listTransactions(limit = 50) {
  const userId = await requireUserId();
  return prisma.transaction.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function getSpendingByCategory(monthsBack = 1) {
  const userId = await requireUserId();
  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack);

  const transactions = await prisma.transaction.findMany({
    where: { userId, type: "EXPENSE", date: { gte: since } },
    include: { category: true },
  });

  const byCategory = new Map<string, { name: string; total: number }>();
  for (const tx of transactions) {
    const key = tx.category?.id ?? "uncategorized";
    const name = tx.category?.name ?? "Без категории";
    const entry = byCategory.get(key) ?? { name, total: 0 };
    entry.total += tx.amountCents;
    byCategory.set(key, entry);
  }

  return Array.from(byCategory.values()).map((entry) => ({
    name: entry.name,
    total: entry.total / 100,
  }));
}

export async function getMonthlyTrend(monthsBack = 6) {
  const userId = await requireUserId();
  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack);
  since.setDate(1);

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: since } },
    select: { type: true, amountCents: true, date: true },
  });

  const byMonth = new Map<string, { income: number; expense: number }>();
  for (const tx of transactions) {
    const key = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, "0")}`;
    const entry = byMonth.get(key) ?? { income: 0, expense: 0 };
    if (tx.type === "INCOME") entry.income += tx.amountCents;
    else entry.expense += tx.amountCents;
    byMonth.set(key, entry);
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month,
      income: v.income / 100,
      expense: v.expense / 100,
    }));
}
