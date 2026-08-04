"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";
import { groupSpendingByCategory, groupMonthlyTrend } from "@/lib/chart-calc";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

const createTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().positive("Сумма должна быть больше нуля"),
  accountId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  description: z.string().max(500).optional(),
  date: z.coerce.date(),
});

export async function createTransaction(input: unknown) {
  const userId = await requireUserId();
  const data = createTransactionSchema.parse(input);

  let currency = "RUB";
  if (data.accountId) {
    const account = await prisma.financialAccount.findFirst({
      where: { id: data.accountId, userId },
      select: { currency: true },
    });
    if (account) currency = account.currency;
  } else {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { defaultCurrency: true },
    });
    if (user) currency = user.defaultCurrency;
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId,
      type: data.type as TransactionType,
      amountCents: Math.round(data.amount * 100),
      currency,
      accountId: data.accountId || null,
      categoryId: data.categoryId || null,
      description: data.description,
      date: data.date,
    },
  });

  revalidatePath("/dashboard");
  return transaction;
}

const updateTransactionSchema = createTransactionSchema.extend({
  id: z.string(),
});

export async function updateTransaction(input: unknown) {
  const userId = await requireUserId();
  const data = updateTransactionSchema.parse(input);

  let currency: string | undefined;
  if (data.accountId) {
    const account = await prisma.financialAccount.findFirst({
      where: { id: data.accountId, userId },
      select: { currency: true },
    });
    if (account) currency = account.currency;
  }

  const result = await prisma.transaction.updateMany({
    where: { id: data.id, userId },
    data: {
      type: data.type as TransactionType,
      amountCents: Math.round(data.amount * 100),
      ...(currency ? { currency } : {}),
      accountId: data.accountId || null,
      categoryId: data.categoryId || null,
      description: data.description,
      date: data.date,
    },
  });

  if (result.count === 0) {
    throw new Error("Транзакция не найдена");
  }

  revalidatePath("/dashboard");
}

export async function deleteTransaction(transactionId: string) {
  const userId = await requireUserId();
  await prisma.transaction.deleteMany({ where: { id: transactionId, userId } });
  revalidatePath("/dashboard");
}

export async function listTransactions({
  page = 1,
  pageSize = 25,
}: { page?: number; pageSize?: number } = {}) {
  const userId = await requireUserId();

  const [transactions, totalCount] = await prisma.$transaction([
    prisma.transaction.findMany({
      where: { userId },
      include: { category: true, account: true },
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.transaction.count({ where: { userId } }),
  ]);

  return {
    transactions,
    totalCount,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

export async function listUsedCurrencies(): Promise<string[]> {
  const userId = await requireUserId();
  const rows = await prisma.transaction.findMany({
    where: { userId },
    distinct: ["currency"],
    select: { currency: true },
  });
  return rows.map((r) => r.currency);
}

export async function getSummaryStats() {
  const userId = await requireUserId();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [allTimeAgg, monthAgg] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["currency", "type"],
      where: { userId },
      _sum: { amountCents: true },
    }),
    prisma.transaction.groupBy({
      by: ["currency", "type"],
      where: { userId, date: { gte: monthStart, lt: monthEnd } },
      _sum: { amountCents: true },
    }),
  ]);

  type Stat = { income: number; expense: number; balance: number };
  const balanceByCurrency = new Map<string, Stat>();
  const monthByCurrency = new Map<string, Stat>();

  for (const row of allTimeAgg) {
    const entry = balanceByCurrency.get(row.currency) ?? { income: 0, expense: 0, balance: 0 };
    const sum = row._sum.amountCents ?? 0;
    if (row.type === "INCOME") {
      entry.income += sum;
      entry.balance += sum;
    } else {
      entry.expense += sum;
      entry.balance -= sum;
    }
    balanceByCurrency.set(row.currency, entry);
  }

  for (const row of monthAgg) {
    const entry = monthByCurrency.get(row.currency) ?? { income: 0, expense: 0, balance: 0 };
    const sum = row._sum.amountCents ?? 0;
    if (row.type === "INCOME") {
      entry.income += sum;
      entry.balance += sum;
    } else {
      entry.expense += sum;
      entry.balance -= sum;
    }
    monthByCurrency.set(row.currency, entry);
  }

  const currencies = Array.from(
    new Set([...balanceByCurrency.keys(), ...monthByCurrency.keys()]),
  );

  return currencies.map((currency) => ({
    currency,
    balance: balanceByCurrency.get(currency)?.balance ?? 0,
    monthIncome: monthByCurrency.get(currency)?.income ?? 0,
    monthExpense: monthByCurrency.get(currency)?.expense ?? 0,
  }));
}

export async function getSpendingByCategory(monthsBack: number, currency: string) {
  const userId = await requireUserId();
  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack);

  const transactions = await prisma.transaction.findMany({
    where: { userId, type: "EXPENSE", currency, date: { gte: since } },
    include: { category: true },
  });

  return groupSpendingByCategory(transactions);
}

export async function getMonthlyTrend(monthsBack: number, currency: string) {
  const userId = await requireUserId();
  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack);
  since.setDate(1);

  const transactions = await prisma.transaction.findMany({
    where: { userId, currency, date: { gte: since } },
    select: { type: true, amountCents: true, date: true },
  });

  return groupMonthlyTrend(transactions);
}
