export interface BudgetProgress {
  limitCents: number;
  spentCents: number;
  percentUsed: number;
  isOverBudget: boolean;
  remainingCents: number;
}

/**
 * Pure calculation of budget progress, kept separate from the Prisma-backed
 * server action so it can be unit-tested without a database.
 */
export function calculateBudgetProgress(limitCents: number, spentCents: number): BudgetProgress {
  const percentUsed = limitCents > 0 ? Math.min(100, (spentCents / limitCents) * 100) : 0;
  return {
    limitCents,
    spentCents,
    percentUsed,
    isOverBudget: spentCents > limitCents,
    remainingCents: limitCents - spentCents,
  };
}
