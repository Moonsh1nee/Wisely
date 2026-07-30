import { createHash } from "node:crypto";

export interface RawCsvRow {
  date: string;
  description: string;
  amount: string;
}

export interface ParsedImportRow {
  date: Date;
  description: string;
  amountCents: number;
  type: "INCOME" | "EXPENSE";
  importHash: string;
}

/**
 * Computes a stable dedup hash for a transaction row so re-importing the
 * same bank statement does not create duplicate transactions.
 */
export function computeImportHash(userId: string, date: Date, amountCents: number, description: string): string {
  const normalizedDescription = description.trim().toLowerCase();
  const key = `${userId}|${date.toISOString().slice(0, 10)}|${amountCents}|${normalizedDescription}`;
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Parses a generic CSV row (already split into date/description/amount
 * strings by papaparse + column mapping) into a normalized transaction.
 * Positive amounts are treated as income, negative as expense.
 */
export function parseCsvRow(userId: string, row: RawCsvRow): ParsedImportRow | null {
  const date = new Date(row.date);
  if (Number.isNaN(date.getTime())) return null;

  const cleanedAmount = row.amount.replace(/[^\d.,-]/g, "").replace(",", ".");
  const amount = Number.parseFloat(cleanedAmount);
  if (Number.isNaN(amount) || amount === 0) return null;

  const amountCents = Math.round(Math.abs(amount) * 100);
  const type: "INCOME" | "EXPENSE" = amount > 0 ? "INCOME" : "EXPENSE";
  const description = row.description.trim();

  return {
    date,
    description,
    amountCents,
    type,
    importHash: computeImportHash(userId, date, amountCents, description),
  };
}
