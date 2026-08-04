const MONTHS_RU = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Pure date-bucket labeling for a transaction-history feed, kept separate
 * from rendering so it's unit-testable without mounting a component.
 */
export function labelForDate(date: Date, now: Date = new Date()): string {
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

  if (isSameDay(date, now)) return "Сегодня";
  if (isSameDay(date, yesterday)) return "Вчера";

  const day = date.getDate();
  const month = MONTHS_RU[date.getMonth()];
  return date.getFullYear() === now.getFullYear() ? `${day} ${month}` : `${day} ${month} ${date.getFullYear()}`;
}

export interface DateGroup<T> {
  label: string;
  items: T[];
}

/**
 * Groups already date-sorted-descending items into labeled buckets
 * ("Сегодня", "Вчера", "<day> <month>"), preserving item order within each
 * bucket and bucket order as encountered.
 */
export function groupByDateLabel<T>(items: T[], getDate: (item: T) => Date, now: Date = new Date()): DateGroup<T>[] {
  const groups: DateGroup<T>[] = [];
  const indexByLabel = new Map<string, number>();

  for (const item of items) {
    const label = labelForDate(getDate(item), now);
    let index = indexByLabel.get(label);
    if (index === undefined) {
      index = groups.length;
      indexByLabel.set(label, index);
      groups.push({ label, items: [] });
    }
    groups[index].items.push(item);
  }

  return groups;
}
