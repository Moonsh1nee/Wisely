interface Transaction {
  type: "INCOME" | "EXPENSE";
  amountCents: number;
  date: Date;
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
}

export function SummaryCards({ transactions }: { transactions: Transaction[] }) {
  const now = new Date();
  const monthTx = transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const income = monthTx
    .filter((tx) => tx.type === "INCOME")
    .reduce((sum, tx) => sum + tx.amountCents, 0);
  const expense = monthTx
    .filter((tx) => tx.type === "EXPENSE")
    .reduce((sum, tx) => sum + tx.amountCents, 0);
  const balance = transactions.reduce(
    (sum, tx) => sum + (tx.type === "INCOME" ? tx.amountCents : -tx.amountCents),
    0,
  );

  const cards = [
    { label: "Общий баланс", value: balance, accent: "text-foreground" },
    { label: "Доход за месяц", value: income, accent: "text-success" },
    { label: "Расход за месяц", value: expense, accent: "text-danger" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
          <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${card.accent}`}>
            {formatMoney(card.value)}
          </p>
        </div>
      ))}
    </div>
  );
}
