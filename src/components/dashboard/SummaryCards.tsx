import { formatMoney } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";

interface SummaryStat {
  currency: string;
  balance: number;
  monthIncome: number;
  monthExpense: number;
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
              <Card key={card.label}>
                <CardContent>
                  <p className="text-xs font-medium text-muted-foreground">
                    {card.label}
                    {currencies.length > 1 ? ` · ${stat.currency}` : ""}
                  </p>
                  <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${card.accent}`}>
                    {formatMoney(card.value / 100, stat.currency)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      })}
    </div>
  );
}
