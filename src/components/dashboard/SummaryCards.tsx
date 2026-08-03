interface SummaryStat {
  currency: string;
  balance: number;
  monthIncome: number;
  monthExpense: number;
}

function formatMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("ru-RU", { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

export function SummaryCards({ stats }: { stats: SummaryStat[] }) {
  const currencies = stats.length > 0 ? stats : [{ currency: "RUB", balance: 0, monthIncome: 0, monthExpense: 0 }];

  return (
    <div className="flex flex-col gap-4">
      {currencies.map((stat) => {
        const cards = [
          { label: "Общий баланс", value: stat.balance, accent: "text-foreground" },
          { label: "Доход за месяц", value: stat.monthIncome, accent: "text-success" },
          { label: "Расход за месяц", value: stat.monthExpense, accent: "text-danger" },
        ];

        return (
          <div key={stat.currency} className="grid gap-4 sm:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <p className="text-xs font-medium text-muted-foreground">
                  {card.label}
                  {currencies.length > 1 ? ` · ${stat.currency}` : ""}
                </p>
                <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${card.accent}`}>
                  {formatMoney(card.value, stat.currency)}
                </p>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
