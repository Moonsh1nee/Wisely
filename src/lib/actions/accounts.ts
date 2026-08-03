"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      },
    });

    revalidatePath("/dashboard");
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
    },
  });

  if (result.count === 0) {
    throw new Error("Счёт не найден");
  }

  revalidatePath("/dashboard");
}

export async function archiveAccount(accountId: string) {
  const userId = await requireUserId();
  await prisma.financialAccount.updateMany({
    where: { id: accountId, userId },
    data: { archived: true },
  });
  revalidatePath("/dashboard");
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

  await prisma.financialAccount.deleteMany({ where: { id: accountId, userId } });
  revalidatePath("/dashboard");
}

export async function listAccountsWithBalance() {
  const userId = await requireUserId();
  const accounts = await prisma.financialAccount.findMany({
    where: { userId, archived: false },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const results = await Promise.all(
    accounts.map(async (account) => {
      const [incomeAgg, expenseAgg] = await Promise.all([
        prisma.transaction.aggregate({
          where: { accountId: account.id, userId, type: "INCOME" },
          _sum: { amountCents: true },
        }),
        prisma.transaction.aggregate({
          where: { accountId: account.id, userId, type: "EXPENSE" },
          _sum: { amountCents: true },
        }),
      ]);

      const balanceCents =
        account.initialBalanceCents +
        (incomeAgg._sum.amountCents ?? 0) -
        (expenseAgg._sum.amountCents ?? 0);

      return {
        id: account.id,
        name: account.name,
        currency: account.currency,
        color: account.color,
        icon: account.icon,
        initialBalance: account.initialBalanceCents / 100,
        balance: balanceCents / 100,
      };
    }),
  );

  return results;
}
