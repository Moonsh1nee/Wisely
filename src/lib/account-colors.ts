/**
 * FinancialAccount.color stores one of these preset keys (not a free hex
 * value) — each maps to one of the already CVD-validated categorical chart
 * hues, so account cards stay visually consistent with the rest of the app.
 * chart-6 (green) and chart-8 (red) are deliberately excluded: green/red
 * read as "good"/"overdrawn" status elsewhere in the UI, not as arbitrary
 * card colors.
 */
export const ACCOUNT_COLOR_PRESETS = [
  { key: "chart-1", label: "Синий" },
  { key: "chart-2", label: "Оранжевый" },
  { key: "chart-3", label: "Бирюзовый" },
  { key: "chart-4", label: "Жёлтый" },
  { key: "chart-5", label: "Розовый" },
  { key: "chart-7", label: "Фиолетовый" },
] as const;

const DEFAULT_PRESET = "chart-1";

export function accountCardGradient(colorKey: string | null | undefined): string {
  const key = ACCOUNT_COLOR_PRESETS.some((p) => p.key === colorKey) ? colorKey : DEFAULT_PRESET;
  return `linear-gradient(135deg, var(--${key}), color-mix(in oklab, var(--${key}) 100%, black 30%))`;
}
