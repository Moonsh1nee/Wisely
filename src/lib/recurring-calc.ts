import type { RecurrenceFrequency } from "@prisma/client";

/**
 * Pure recurrence-scheduling helpers, kept separate from the Prisma-backed
 * server action so they can be unit-tested without a database.
 */

export function advanceNextRun(date: Date, frequency: RecurrenceFrequency): Date {
  const next = new Date(date);
  switch (frequency) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

export interface RecurringRule {
  nextRunAt: Date;
  endDate: Date | null;
  frequency: RecurrenceFrequency;
}

export interface DueOccurrencesResult {
  occurrenceDates: Date[];
  newNextRunAt: Date;
}

/**
 * Walks a recurrence rule forward from its current `nextRunAt` up to `now`,
 * collecting every occurrence that has come due (including "catch-up" for
 * missed periods if the app wasn't opened for a while). `maxOccurrences` is a
 * defensive cap against a malformed rule (e.g. a frequency that never
 * advances) causing a runaway loop.
 */
export function computeDueOccurrences(
  rule: RecurringRule,
  now: Date,
  maxOccurrences = 500,
): DueOccurrencesResult {
  const occurrenceDates: Date[] = [];
  let cursor = rule.nextRunAt;

  while (
    cursor <= now &&
    (rule.endDate === null || cursor <= rule.endDate) &&
    occurrenceDates.length < maxOccurrences
  ) {
    occurrenceDates.push(cursor);
    cursor = advanceNextRun(cursor, rule.frequency);
  }

  return { occurrenceDates, newNextRunAt: cursor };
}
