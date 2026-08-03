interface Transaction {
  type: "INCOME" | "EXPENSE";
  amountCents: number;
  currency: string;
  date: Date;
}

function formatMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("ru-RU", { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

function groupByCurrency(transactions: Transaction[]) {
  const byCurrency = new Map<string, { income: number; expense: number; balance: number }>();
  for (const tx of transactions) {
    const entry = byCurrency.get(tx.currency) ?? { income: 0, expense: 0, balance: 0 };
    if (tx.type === "INCOME") {
      entry.income += tx.amountCents;
      entry.balance += tx.amountCents;
    } else {
      entry.expense += tx.amountCents;
      entry.balance -= tx.amountCents;
    }
    byCurrency.set(tx.currency, entry);
  }
  return byCurrency;
}

export function SummaryCards({ transactions }: { transactions: Transaction[] }) {
  const now = new Date();
  const monthTx = transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const balanceByCurrency = groupByCurrency(transactions);
  const monthByCurrency = groupByCurrency(monthTx);

  const currencies = Array.from(
    new Set([...balanceByCurrency.keys(), ...monthByCurrency.keys()]),
  );

  if (currencies.length === 0) {
    currencies.push("RUB");
  }

  return (
    <div className="flex flex-col gap-4">
      {currencies.map((currency) => {
        const balance = balanceByCurrency.get(currency)?.balance ?? 0;
        const income = monthByCurrency.get(currency)?.income ?? 0;
        const expense = monthByCurrency.get(currency)?.expense ?? 0;

        const cards = [
          { label: "Общий баланс", value: balance, accent: "text-foreground" },
          { label: "Доход за месяц", value: income, accent: "text-success" },
          { label: "Расход за месяц", value: expense, accent: "text-danger" },
        ];

        return (
          <div key={currency} className="grid gap-4 sm:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <p className="text-xs font-medium text-muted-foreground">
                  {card.label}
                  {currencies.length > 1 ? ` · ${currency}` : ""}
                </p>
                <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${card.accent}`}>
                  {formatMoney(card.value, currency)}
                </p>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
