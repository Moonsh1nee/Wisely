/**
 * Pure aggregation helpers for dashboard charts, kept separate from the
 * Prisma-backed server actions so they can be unit-tested without a database.
 * Callers are responsible for pre-filtering rows to a single currency —
 * these functions never mix currencies themselves.
 */

export interface SpendingCategoryRow {
  amountCents: number;
  category: { id: string; name: string } | null;
}

export interface CategorySlice {
  /** `null` = "Без категории" (a real, filterable bucket). `undefined` = the
   * folded "Остальное" bucket, which has no single category behind it and
   * so isn't a valid drill-down target. */
  id: string | null | undefined;
  name: string;
  total: number;
}

/**
 * Groups spending by category, sorted largest-first. Beyond `maxSlices`
 * categories, the smallest are folded into a single "Остальное" bucket —
 * a pie/donut with a dozen-plus thin slices produces illegible overlapping
 * labels and forces categorical colors to repeat past what's distinguishable.
 */
export function groupSpendingByCategory(
  rows: SpendingCategoryRow[],
  maxSlices = 7,
): CategorySlice[] {
  const byCategory = new Map<string, CategorySlice>();
  for (const row of rows) {
    const key = row.category?.id ?? "uncategorized";
    const id = row.category?.id ?? null;
    const name = row.category?.name ?? "Без категории";
    const entry = byCategory.get(key) ?? { id, name, total: 0 };
    entry.total += row.amountCents;
    byCategory.set(key, entry);
  }

  const sorted = Array.from(byCategory.values())
    .map((entry) => ({ id: entry.id, name: entry.name, total: entry.total / 100 }))
    .sort((a, b) => b.total - a.total);

  if (sorted.length <= maxSlices) return sorted;

  const top = sorted.slice(0, maxSlices - 1);
  const restTotal = sorted.slice(maxSlices - 1).reduce((sum, s) => sum + s.total, 0);
  return [...top, { id: undefined, name: "Остальное", total: restTotal }];
}

export interface MonthlyTrendRow {
  type: "INCOME" | "EXPENSE";
  amountCents: number;
  date: Date;
}

export interface MonthlyTrendPoint {
  month: string;
  income: number;
  expense: number;
}

export function groupMonthlyTrend(rows: MonthlyTrendRow[]): MonthlyTrendPoint[] {
  const byMonth = new Map<string, { income: number; expense: number }>();
  for (const row of rows) {
    const key = `${row.date.getFullYear()}-${String(row.date.getMonth() + 1).padStart(2, "0")}`;
    const entry = byMonth.get(key) ?? { income: 0, expense: 0 };
    if (row.type === "INCOME") entry.income += row.amountCents;
    else entry.expense += row.amountCents;
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
