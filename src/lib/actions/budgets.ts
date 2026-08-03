"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateBudgetProgress } from "@/lib/budget-calc";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

const createBudgetSchema = z.object({
  name: z.string().min(1).max(100),
  limit: z.coerce.number().positive(),
  categoryId: z.string().optional().nullable(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
});

export async function createBudget(input: unknown) {
  const userId = await requireUserId();
  const data = createBudgetSchema.parse(input);

  const budget = await prisma.budget.create({
    data: {
      userId,
      name: data.name,
      limitCents: Math.round(data.limit * 100),
      categoryId: data.categoryId || null,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
    },
  });

  revalidatePath("/dashboard");
  return budget;
}

const updateBudgetSchema = createBudgetSchema.extend({
  id: z.string(),
});

export async function updateBudget(input: unknown) {
  const userId = await requireUserId();
  const data = updateBudgetSchema.parse(input);

  const result = await prisma.budget.updateMany({
    where: { id: data.id, userId },
    data: {
      name: data.name,
      limitCents: Math.round(data.limit * 100),
      categoryId: data.categoryId || null,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
    },
  });

  if (result.count === 0) {
    throw new Error("Бюджет не найден");
  }

  revalidatePath("/dashboard");
}

export async function deleteBudget(budgetId: string) {
  const userId = await requireUserId();
  await prisma.budget.deleteMany({ where: { id: budgetId, userId } });
  revalidatePath("/dashboard");
}

export async function listBudgetsWithSpent() {
  const userId = await requireUserId();
  const budgets = await prisma.budget.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { periodStart: "desc" },
  });

  const results = await Promise.all(
    budgets.map(async (budget) => {
      const spentAgg = await prisma.transaction.aggregate({
        where: {
          userId,
          type: "EXPENSE",
          date: { gte: budget.periodStart, lte: budget.periodEnd },
          ...(budget.categoryId ? { categoryId: budget.categoryId } : {}),
        },
        _sum: { amountCents: true },
      });

      const spentCents = spentAgg._sum.amountCents ?? 0;
      const progress = calculateBudgetProgress(budget.limitCents, spentCents);

      return {
        id: budget.id,
        name: budget.name,
        categoryId: budget.categoryId,
        categoryName: budget.category?.name ?? "Все категории",
        limit: progress.limitCents / 100,
        spent: progress.spentCents / 100,
        periodStart: budget.periodStart,
        periodEnd: budget.periodEnd,
      };
    }),
  );

  return results;
}
