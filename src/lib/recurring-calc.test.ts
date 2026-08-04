import { describe, it, expect } from "vitest";
import { advanceNextRun, computeDueOccurrences } from "@/lib/recurring-calc";

describe("advanceNextRun", () => {
  it("advances by one day for DAILY", () => {
    const next = advanceNextRun(new Date(2026, 0, 1), "DAILY");
    expect(next).toEqual(new Date(2026, 0, 2));
  });

  it("advances by seven days for WEEKLY", () => {
    const next = advanceNextRun(new Date(2026, 0, 1), "WEEKLY");
    expect(next).toEqual(new Date(2026, 0, 8));
  });

  it("advances by one month for MONTHLY", () => {
    const next = advanceNextRun(new Date(2026, 0, 15), "MONTHLY");
    expect(next).toEqual(new Date(2026, 1, 15));
  });

  it("advances by one year for YEARLY", () => {
    const next = advanceNextRun(new Date(2026, 5, 1), "YEARLY");
    expect(next).toEqual(new Date(2027, 5, 1));
  });
});

describe("computeDueOccurrences", () => {
  it("returns a single occurrence when the rule is due once", () => {
    const now = new Date(2026, 0, 10);
    const result = computeDueOccurrences(
      { nextRunAt: new Date(2026, 0, 5), endDate: null, frequency: "MONTHLY" },
      now,
    );

    expect(result.occurrenceDates).toEqual([new Date(2026, 0, 5)]);
    expect(result.newNextRunAt).toEqual(new Date(2026, 1, 5));
  });

  it("catches up on multiple missed periods", () => {
    const now = new Date(2026, 3, 1);
    const result = computeDueOccurrences(
      { nextRunAt: new Date(2026, 0, 1), endDate: null, frequency: "MONTHLY" },
      now,
    );

    expect(result.occurrenceDates).toEqual([
      new Date(2026, 0, 1),
      new Date(2026, 1, 1),
      new Date(2026, 2, 1),
      new Date(2026, 3, 1),
    ]);
    expect(result.newNextRunAt).toEqual(new Date(2026, 4, 1));
  });

  it("stops generating once endDate is passed", () => {
    const now = new Date(2026, 5, 1);
    const result = computeDueOccurrences(
      {
        nextRunAt: new Date(2026, 0, 1),
        endDate: new Date(2026, 1, 15),
        frequency: "MONTHLY",
      },
      now,
    );

    expect(result.occurrenceDates).toEqual([new Date(2026, 0, 1), new Date(2026, 1, 1)]);
  });

  it("returns nothing when nextRunAt is in the future", () => {
    const now = new Date(2026, 0, 1);
    const result = computeDueOccurrences(
      { nextRunAt: new Date(2026, 0, 10), endDate: null, frequency: "DAILY" },
      now,
    );

    expect(result.occurrenceDates).toEqual([]);
    expect(result.newNextRunAt).toEqual(new Date(2026, 0, 10));
  });

  it("respects the maxOccurrences defensive cap", () => {
    const now = new Date(2030, 0, 1);
    const result = computeDueOccurrences(
      { nextRunAt: new Date(2020, 0, 1), endDate: null, frequency: "DAILY" },
      now,
      50,
    );

    expect(result.occurrenceDates).toHaveLength(50);
  });
});
