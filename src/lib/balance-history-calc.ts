export interface BalanceEvent {
  date: Date;
  deltaCents: number;
}

export interface BalancePoint {
  month: string; // YYYY-MM
  balance: number; // main currency units, not cents
}

/**
 * Pure running-balance sampler, kept separate from the Prisma-backed server
 * action so it can be unit-tested without a database. Produces one point per
 * month (the balance as of that month's end), ending with the current month.
 * Events dated before the window are still folded into the first bucket —
 * they're part of the account's ongoing balance, not dropped.
 */
export function buildBalanceHistory(
  initialBalanceCents: number,
  events: BalanceEvent[],
  monthsBack = 6,
): BalancePoint[] {
  const now = new Date();
  const sorted = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());

  const months: { year: number; month: number }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }

  let cumulative = initialBalanceCents;
  let eventIndex = 0;
  const points: BalancePoint[] = [];

  for (const { year, month } of months) {
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
    while (eventIndex < sorted.length && sorted[eventIndex].date <= monthEnd) {
      cumulative += sorted[eventIndex].deltaCents;
      eventIndex++;
    }
    points.push({
      month: `${year}-${String(month + 1).padStart(2, "0")}`,
      balance: cumulative / 100,
    });
  }

  return points;
}
