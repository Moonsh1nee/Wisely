import { describe, it, expect, vi, afterEach } from "vitest";
import { buildBalanceHistory } from "@/lib/balance-history-calc";

afterEach(() => {
  vi.useRealTimers();
});

describe("buildBalanceHistory", () => {
  it("returns the initial balance for every month when there are no events", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15));

    const result = buildBalanceHistory(100000, [], 3);

    expect(result).toEqual([
      { month: "2026-04", balance: 1000 },
      { month: "2026-05", balance: 1000 },
      { month: "2026-06", balance: 1000 },
    ]);
  });

  it("accumulates deltas into the running balance month over month", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 10));

    const result = buildBalanceHistory(
      0,
      [
        { date: new Date(2026, 0, 5), deltaCents: 10000 },
        { date: new Date(2026, 1, 15), deltaCents: -3000 },
        { date: new Date(2026, 2, 1), deltaCents: 5000 },
      ],
      3,
    );

    expect(result).toEqual([
      { month: "2026-01", balance: 100 },
      { month: "2026-02", balance: 70 },
      { month: "2026-03", balance: 120 },
    ]);
  });

  it("folds events from before the window into the first bucket", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 1));

    const result = buildBalanceHistory(
      0,
      [{ date: new Date(2020, 0, 1), deltaCents: 50000 }],
      2,
    );

    expect(result).toEqual([
      { month: "2026-05", balance: 500 },
      { month: "2026-06", balance: 500 },
    ]);
  });

  it("defaults to a 6-month window", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 1));

    const result = buildBalanceHistory(0, []);
    expect(result).toHaveLength(6);
    expect(result[result.length - 1].month).toBe("2026-06");
    expect(result[0].month).toBe("2026-01");
  });
});
