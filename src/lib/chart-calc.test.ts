import { describe, it, expect } from "vitest";
import { groupSpendingByCategory, groupMonthlyTrend } from "@/lib/chart-calc";

describe("groupSpendingByCategory", () => {
  it("sums amounts per category and converts cents to units", () => {
    const result = groupSpendingByCategory([
      { amountCents: 1000, category: { id: "a", name: "Продукты" } },
      { amountCents: 500, category: { id: "a", name: "Продукты" } },
      { amountCents: 2000, category: { id: "b", name: "Транспорт" } },
    ]);

    expect(result).toContainEqual({ id: "a", name: "Продукты", total: 15 });
    expect(result).toContainEqual({ id: "b", name: "Транспорт", total: 20 });
    expect(result).toHaveLength(2);
  });

  it("buckets rows with no category as 'Без категории' with a null id", () => {
    const result = groupSpendingByCategory([
      { amountCents: 300, category: null },
      { amountCents: 200, category: null },
    ]);

    expect(result).toEqual([{ id: null, name: "Без категории", total: 5 }]);
  });

  it("returns an empty array for no rows", () => {
    expect(groupSpendingByCategory([])).toEqual([]);
  });

  it("sorts categories largest total first", () => {
    const result = groupSpendingByCategory([
      { amountCents: 100, category: { id: "a", name: "Small" } },
      { amountCents: 900, category: { id: "b", name: "Big" } },
      { amountCents: 500, category: { id: "c", name: "Medium" } },
    ]);

    expect(result.map((r) => r.name)).toEqual(["Big", "Medium", "Small"]);
  });

  it("folds overflow beyond maxSlices into 'Остальное'", () => {
    const rows = Array.from({ length: 9 }, (_, i) => ({
      amountCents: (9 - i) * 100,
      category: { id: `cat-${i}`, name: `Cat ${i}` },
    }));

    const result = groupSpendingByCategory(rows, 5);

    expect(result).toHaveLength(5);
    expect(result.slice(0, 4).map((r) => r.name)).toEqual(["Cat 0", "Cat 1", "Cat 2", "Cat 3"]);
    expect(result[4].name).toBe("Остальное");
    expect(result[4].id).toBeUndefined();
    // Cat 4..Cat 8 = (5+4+3+2+1) * 100 cents = 1500 cents = 15 units
    expect(result[4].total).toBe(15);
  });

  it("does not fold when category count is within maxSlices", () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({
      amountCents: 100,
      category: { id: `cat-${i}`, name: `Cat ${i}` },
    }));

    const result = groupSpendingByCategory(rows, 7);
    expect(result).toHaveLength(5);
    expect(result.some((r) => r.name === "Остальное")).toBe(false);
  });
});

describe("groupMonthlyTrend", () => {
  it("splits income and expense per month", () => {
    const result = groupMonthlyTrend([
      { type: "INCOME", amountCents: 100000, date: new Date(2026, 0, 5) },
      { type: "EXPENSE", amountCents: 5000, date: new Date(2026, 0, 10) },
      { type: "EXPENSE", amountCents: 2500, date: new Date(2026, 0, 20) },
    ]);

    expect(result).toEqual([{ month: "2026-01", income: 1000, expense: 75 }]);
  });

  it("sorts months chronologically across a year boundary", () => {
    const result = groupMonthlyTrend([
      { type: "EXPENSE", amountCents: 100, date: new Date(2026, 11, 15) },
      { type: "EXPENSE", amountCents: 100, date: new Date(2025, 11, 15) },
      { type: "EXPENSE", amountCents: 100, date: new Date(2026, 0, 15) },
    ]);

    expect(result.map((r) => r.month)).toEqual(["2025-12", "2026-01", "2026-12"]);
  });

  it("returns an empty array for no rows", () => {
    expect(groupMonthlyTrend([])).toEqual([]);
  });
});
