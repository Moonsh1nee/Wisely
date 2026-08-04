export interface GoalProgress {
  goalCents: number;
  balanceCents: number;
  percent: number;
  remainingCents: number;
  isReached: boolean;
}

/**
 * Pure calculation of savings-goal progress ("копилка"), kept separate from
 * the Prisma-backed server action so it can be unit-tested without a
 * database. Mirrors budget-calc.ts's shape but the sign of "good" is
 * flipped: reaching/exceeding the goal is the success case, not overspend.
 */
export function calculateGoalProgress(goalCents: number, balanceCents: number): GoalProgress {
  const percent = goalCents > 0 ? Math.max(0, Math.min(100, (balanceCents / goalCents) * 100)) : 0;
  return {
    goalCents,
    balanceCents,
    percent,
    remainingCents: Math.max(0, goalCents - balanceCents),
    isReached: balanceCents >= goalCents,
  };
}
