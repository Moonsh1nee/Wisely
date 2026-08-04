"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma, type AccountType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateGoalProgress } from "@/lib/goal-calc";
import { buildBalanceHistory } from "@/lib/balance-history-calc";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

const createAccountSchema = z.object({
  name: z.string().min(1).max(60),
  currency: z.string().min(1).max(10),
  initialBalance: z.coerce.number().default(0),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  accountType: z.enum(["CHECKING", "SAVINGS"]).default("CHECKING"),
  goalAmount: z.coerce.number().positive().optional().nullable(),
  goalDate: z.coerce.date().optional().nullable(),
});

export async function createAccount(input: unknown) {
  const userId = await requireUserId();
  const data = createAccountSchema.parse(input);

  try {
    const account = await prisma.financialAccount.create({
      data: {
        userId,
        name: data.name,
        currency: data.currency,
        initialBalanceCents: Math.round(data.initialBalance * 100),
        color: data.color || null,
        icon: data.icon || null,
        accountType: data.accountType as AccountType,
        goalAmountCents: data.goalAmount ? Math.round(data.goalAmount * 100) : null,
        goalDate: data.goalDate || null,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/accounts");
    return account;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new Error("Счёт с таким названием уже существует");
    }
    throw err;
  }
}

const updateAccountSchema = createAccountSchema.extend({
  id: z.string(),
});

export async function updateAccount(input: unknown) {
  const userId = await requireUserId();
  const data = updateAccountSchema.parse(input);

  const result = await prisma.financialAccount.updateMany({
    where: { id: data.id, userId },
    data: {
      name: data.name,
      currency: data.currency,
      initialBalanceCents: Math.round(data.initialBalance * 100),
      color: data.color || null,
      icon: data.icon || null,
      accountType: data.accountType as AccountType,
      goalAmountCents: data.goalAmount ? Math.round(data.goalAmount * 100) : null,
      goalDate: data.goalDate || null,
    },
  });

  if (result.count === 0) {
    throw new Error("Счёт не найден");
  }

  revalidatePath("/dashboard");
  revalidatePath("/accounts");
}

export async function archiveAccount(accountId: string) {
  const userId = await requireUserId();
  await prisma.financialAccount.updateMany({
    where: { id: accountId, userId },
    data: { archived: true },
  });
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
}

export async function deleteAccount(accountId: string) {
  const userId = await requireUserId();

  const txCount = await prisma.transaction.count({
    where: { accountId, userId },
  });

  if (txCount > 0) {
    // Keep transactions but detach them from the deleted account instead of
    // losing financial history.
    await prisma.transaction.updateMany({
      where: { accountId, userId },
      data: { accountId: null },
    });
  }

  // Transfers touching this account are deleted with it (schema cascade) —
  // unlike transactions, a transfer without one of its two accounts no
  // longer means anything.
  await prisma.financialAccount.deleteMany({ where: { id: accountId, userId } });
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
}

async function computeBalanceCents(userId: string, account: { id: string; initialBalanceCents: number }) {
  const [incomeAgg, expenseAgg, transfersInAgg, transfersOutAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: { accountId: account.id, userId, type: "INCOME" },
      _sum: { amountCents: true },
    }),
    prisma.transaction.aggregate({
      where: { accountId: account.id, userId, type: "EXPENSE" },
      _sum: { amountCents: true },
    }),
    prisma.transfer.aggregate({
      where: { toAccountId: account.id, userId },
      _sum: { amountCents: true },
    }),
    prisma.transfer.aggregate({
      where: { fromAccountId: account.id, userId },
      _sum: { amountCents: true },
    }),
  ]);

  return (
    account.initialBalanceCents +
    (incomeAgg._sum.amountCents ?? 0) -
    (expenseAgg._sum.amountCents ?? 0) +
    (transfersInAgg._sum.amountCents ?? 0) -
    (transfersOutAgg._sum.amountCents ?? 0)
  );
}

export async function listAccountsWithBalance() {
  const userId = await requireUserId();
  const accounts = await prisma.financialAccount.findMany({
    where: { userId, archived: false },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const results = await Promise.all(
    accounts.map(async (account) => {
      const balanceCents = await computeBalanceCents(userId, account);

      return {
        id: account.id,
        name: account.name,
        currency: account.currency,
        color: account.color,
        icon: account.icon,
        accountType: account.accountType,
        initialBalance: account.initialBalanceCents / 100,
        balance: balanceCents / 100,
        goalAmount: account.goalAmountCents ? account.goalAmountCents / 100 : null,
        goalDate: account.goalDate,
        goalProgress:
          account.accountType === "SAVINGS" && account.goalAmountCents
            ? calculateGoalProgress(account.goalAmountCents, balanceCents)
            : null,
      };
    }),
  );

  return results;
}

/**
 * Account detail view: the account itself, its current balance, a merged
 * Transaction+Transfer timeline (so a transfer shows up in the account's
 * history alongside regular income/expense), and goal progress if it's a
 * savings account with a target set.
 */
export async function getAccountDetail(accountId: string) {
  const userId = await requireUserId();
  const account = await prisma.financialAccount.findFirst({ where: { id: accountId, userId } });
  if (!account) throw new Error("Счёт не найден");

  const [transactions, transfersOut, transfersIn] = await Promise.all([
    prisma.transaction.findMany({
      where: { accountId, userId },
      include: { category: true },
      orderBy: { date: "desc" },
    }),
    prisma.transfer.findMany({
      where: { fromAccountId: accountId, userId },
      include: { toAccount: { select: { name: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.transfer.findMany({
      where: { toAccountId: accountId, userId },
      include: { fromAccount: { select: { name: true } } },
      orderBy: { date: "desc" },
    }),
  ]);

  const history = [
    ...transactions.map((t) => ({ kind: "transaction" as const, ...t })),
    ...transfersOut.map((t) => ({
      kind: "transfer" as const,
      id: t.id,
      date: t.date,
      amountCents: t.amountCents,
      currency: t.currency,
      description: t.description,
      direction: "out" as const,
      counterpartyName: t.toAccount.name,
    })),
    ...transfersIn.map((t) => ({
      kind: "transfer" as const,
      id: t.id,
      date: t.date,
      amountCents: t.amountCents,
      currency: t.currency,
      description: t.description,
      direction: "in" as const,
      counterpartyName: t.fromAccount.name,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const balanceCents = await computeBalanceCents(userId, account);

  return {
    id: account.id,
    name: account.name,
    currency: account.currency,
    color: account.color,
    accountType: account.accountType,
    initialBalance: account.initialBalanceCents / 100,
    balance: balanceCents / 100,
    goalAmount: account.goalAmountCents ? account.goalAmountCents / 100 : null,
    goalDate: account.goalDate,
    goalProgress:
      account.accountType === "SAVINGS" && account.goalAmountCents
        ? calculateGoalProgress(account.goalAmountCents, balanceCents)
        : null,
    history,
  };
}

export async function getAccountBalanceHistory(accountId: string, monthsBack = 6) {
  const userId = await requireUserId();
  const account = await prisma.financialAccount.findFirst({ where: { id: accountId, userId } });
  if (!account) throw new Error("Счёт не найден");

  const [transactions, transfersOut, transfersIn] = await Promise.all([
    prisma.transaction.findMany({
      where: { accountId, userId },
      select: { date: true, amountCents: true, type: true },
    }),
    prisma.transfer.findMany({
      where: { fromAccountId: accountId, userId },
      select: { date: true, amountCents: true },
    }),
    prisma.transfer.findMany({
      where: { toAccountId: accountId, userId },
      select: { date: true, amountCents: true },
    }),
  ]);

  const events = [
    ...transactions.map((t) => ({
      date: t.date,
      deltaCents: t.type === "INCOME" ? t.amountCents : -t.amountCents,
    })),
    ...transfersOut.map((t) => ({ date: t.date, deltaCents: -t.amountCents })),
    ...transfersIn.map((t) => ({ date: t.date, deltaCents: t.amountCents })),
  ];

  return buildBalanceHistory(account.initialBalanceCents, events, monthsBack);
}
