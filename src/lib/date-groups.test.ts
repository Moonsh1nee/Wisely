import { describe, it, expect } from "vitest";
import { labelForDate, groupByDateLabel } from "@/lib/date-groups";

const NOW = new Date(2026, 6, 15, 12, 0, 0); // 15 July 2026, noon

describe("labelForDate", () => {
  it("labels the current day as 'Сегодня'", () => {
    expect(labelForDate(new Date(2026, 6, 15, 3, 0), NOW)).toBe("Сегодня");
  });

  it("labels the previous day as 'Вчера'", () => {
    expect(labelForDate(new Date(2026, 6, 14, 23, 59), NOW)).toBe("Вчера");
  });

  it("labels older same-year dates as '<day> <month>'", () => {
    expect(labelForDate(new Date(2026, 0, 3), NOW)).toBe("3 января");
  });

  it("includes the year for dates in a different year", () => {
    expect(labelForDate(new Date(2025, 11, 31), NOW)).toBe("31 декабря 2025");
  });
});

describe("groupByDateLabel", () => {
  it("buckets items under their date label, preserving order", () => {
    const items = [
      { id: 1, date: new Date(2026, 6, 15, 9) },
      { id: 2, date: new Date(2026, 6, 15, 8) },
      { id: 3, date: new Date(2026, 6, 14, 10) },
      { id: 4, date: new Date(2026, 0, 1) },
    ];

    const groups = groupByDateLabel(items, (i) => i.date, NOW);

    expect(groups).toHaveLength(3);
    expect(groups[0]).toEqual({ label: "Сегодня", items: [items[0], items[1]] });
    expect(groups[1]).toEqual({ label: "Вчера", items: [items[2]] });
    expect(groups[2].label).toBe("1 января");
    expect(groups[2].items).toEqual([items[3]]);
  });

  it("returns an empty array for no items", () => {
    expect(groupByDateLabel([], (i: { date: Date }) => i.date, NOW)).toEqual([]);
  });
});
