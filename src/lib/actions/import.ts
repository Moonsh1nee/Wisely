"use server";

import Papa from "papaparse";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCsvRow, type RawCsvRow } from "@/lib/csv-import";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export interface ImportColumnMapping {
  date: string;
  description: string;
  amount: string;
}

export interface ImportResult {
  imported: number;
  skippedDuplicates: number;
  skippedInvalid: number;
  totalRows: number;
}

export async function importCsvStatement(
  csvText: string,
  mapping: ImportColumnMapping,
): Promise<ImportResult> {
  const userId = await requireUserId();

  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const rows = parsed.data;
  let imported = 0;
  let skippedDuplicates = 0;
  let skippedInvalid = 0;

  for (const row of rows) {
    const raw: RawCsvRow = {
      date: row[mapping.date] ?? "",
      description: row[mapping.description] ?? "",
      amount: row[mapping.amount] ?? "",
    };

    const parsedRow = parseCsvRow(userId, raw);
    if (!parsedRow) {
      skippedInvalid += 1;
      continue;
    }

    try {
      await prisma.transaction.create({
        data: {
          userId,
          type: parsedRow.type,
          amountCents: parsedRow.amountCents,
          description: parsedRow.description,
          date: parsedRow.date,
          importHash: parsedRow.importHash,
        },
      });
      imported += 1;
    } catch {
      // Unique constraint on [userId, importHash] -> duplicate row
      skippedDuplicates += 1;
    }
  }

  revalidatePath("/dashboard");

  return {
    imported,
    skippedDuplicates,
    skippedInvalid,
    totalRows: rows.length,
  };
}
