"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";
import { computeDueOccurrences } from "@/lib/recurring-calc";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

const recurringSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().positive("Сумма должна быть больше нуля"),
  currency: z.string().min(1).max(10),
  accountId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  description: z.string().max(500).optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
});

export async function createRecurring(input: unknown) {
  const userId = await requireUserId();
  const data = recurringSchema.parse(input);

  const recurring = await prisma.recurringTransaction.create({
    data: {
      userId,
      type: data.type as TransactionType,
      amountCents: Math.round(data.amount * 100),
      currency: data.currency,
      accountId: data.accountId || null,
      categoryId: data.categoryId || null,
      description: data.description,
      frequency: data.frequency,
      startDate: data.startDate,
      endDate: data.endDate || null,
      nextRunAt: data.startDate,
    },
  });

  revalidatePath("/dashboard");
  return recurring;
}

const updateRecurringSchema = recurringSchema.extend({
  id: z.string(),
});

export async function updateRecurring(input: unknown) {
  const userId = await requireUserId();
  const data = updateRecurringSchema.parse(input);

  const result = await prisma.recurringTransaction.updateMany({
    where: { id: data.id, userId },
    data: {
      type: data.type as TransactionType,
      amountCents: Math.round(data.amount * 100),
      currency: data.currency,
      accountId: data.accountId || null,
      categoryId: data.categoryId || null,
      description: data.description,
      frequency: data.frequency,
      startDate: data.startDate,
      endDate: data.endDate || null,
    },
  });

  if (result.count === 0) {
    throw new Error("Повторяющаяся транзакция не найдена");
  }

  revalidatePath("/dashboard");
}

export async function deleteRecurring(id: string) {
  const userId = await requireUserId();
  await prisma.recurringTransaction.deleteMany({ where: { id, userId } });
  revalidatePath("/dashboard");
}

export async function listRecurringTransactions() {
  const userId = await requireUserId();
  return prisma.recurringTransaction.findMany({
    where: { userId },
    include: { category: true, account: true },
    orderBy: { nextRunAt: "asc" },
  });
}

/**
 * Generates every `Transaction` due for the user's recurring rules, up to
 * now, then advances each rule's `nextRunAt`. Called lazily on page load
 * (see plan: no cron infra for a self-hosted single-process app) rather than
 * on a schedule — a rule due 3 months ago catches up in one pass.
 */
export async function ensureRecurringTransactionsGenerated(userId: string) {
  const now = new Date();
  const dueRules = await prisma.recurringTransaction.findMany({
    where: { userId, nextRunAt: { lte: now } },
  });

  for (const rule of dueRules) {
    const { occurrenceDates, newNextRunAt } = computeDueOccurrences(
      { nextRunAt: rule.nextRunAt, endDate: rule.endDate, frequency: rule.frequency },
      now,
    );
    if (occurrenceDates.length === 0) continue;

    await prisma.$transaction([
      ...occurrenceDates.map((date) =>
        prisma.transaction.create({
          data: {
            userId,
            type: rule.type,
            amountCents: rule.amountCents,
            currency: rule.currency,
            accountId: rule.accountId,
            categoryId: rule.categoryId,
            description: rule.description,
            date,
          },
        }),
      ),
      prisma.recurringTransaction.update({
        where: { id: rule.id },
        data: { nextRunAt: newNextRunAt },
      }),
    ]);
  }
}
