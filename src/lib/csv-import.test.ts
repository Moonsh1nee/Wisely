import { describe, it, expect } from "vitest";
import { computeImportHash, parseCsvRow } from "@/lib/csv-import";

describe("computeImportHash", () => {
  it("produces the same hash for identical date/amount/description", () => {
    const date = new Date("2026-07-01");
    const h1 = computeImportHash("user1", date, 1500, "Coffee Shop");
    const h2 = computeImportHash("user1", date, 1500, "coffee shop");
    expect(h1).toBe(h2);
  });

  it("produces different hashes for different users", () => {
    const date = new Date("2026-07-01");
    const h1 = computeImportHash("user1", date, 1500, "Coffee Shop");
    const h2 = computeImportHash("user2", date, 1500, "Coffee Shop");
    expect(h1).not.toBe(h2);
  });

  it("produces different hashes for different amounts", () => {
    const date = new Date("2026-07-01");
    const h1 = computeImportHash("user1", date, 1500, "Coffee Shop");
    const h2 = computeImportHash("user1", date, 1600, "Coffee Shop");
    expect(h1).not.toBe(h2);
  });
});

describe("parseCsvRow", () => {
  it("parses a positive amount as income", () => {
    const row = parseCsvRow("user1", {
      date: "2026-07-01",
      description: "Salary",
      amount: "1500.50",
    });
    expect(row).not.toBeNull();
    expect(row?.type).toBe("INCOME");
    expect(row?.amountCents).toBe(150050);
  });

  it("parses a negative amount as expense", () => {
    const row = parseCsvRow("user1", {
      date: "2026-07-01",
      description: "Groceries",
      amount: "-45.99",
    });
    expect(row).not.toBeNull();
    expect(row?.type).toBe("EXPENSE");
    expect(row?.amountCents).toBe(4599);
  });

  it("handles comma decimal separators", () => {
    const row = parseCsvRow("user1", {
      date: "2026-07-01",
      description: "Rent",
      amount: "-1200,00",
    });
    expect(row?.amountCents).toBe(120000);
  });

  it("returns null for invalid dates", () => {
    const row = parseCsvRow("user1", {
      date: "not-a-date",
      description: "Whatever",
      amount: "10",
    });
    expect(row).toBeNull();
  });

  it("returns null for zero or invalid amounts", () => {
    const row = parseCsvRow("user1", {
      date: "2026-07-01",
      description: "Whatever",
      amount: "0",
    });
    expect(row).toBeNull();
  });

  it("computes a stable importHash for deduplication", () => {
    const rowA = parseCsvRow("user1", {
      date: "2026-07-01",
      description: "Groceries",
      amount: "-45.99",
    });
    const rowB = parseCsvRow("user1", {
      date: "2026-07-01",
      description: "Groceries",
      amount: "-45.99",
    });
    expect(rowA?.importHash).toBe(rowB?.importHash);
  });
});
