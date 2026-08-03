"use client";

import { useTransition } from "react";
import { deleteTransaction } from "@/lib/actions/transactions";

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amountCents: number;
  currency: string;
  description: string | null;
  date: Date;
  category: { name: string } | null;
}

function formatAmount(amountCents: number, currency: string) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency }).format(
    amountCents / 100,
  );
}

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  const [isPending, startTransition] = useTransition();

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Транзакций пока нет
        </p>
        <p className="text-xs text-muted-foreground">
          Добавьте первую транзакцию выше, чтобы начать отслеживать финансы.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Дата</th>
              <th className="px-4 py-3 font-medium">Описание</th>
              <th className="px-4 py-3 font-medium">Категория</th>
              <th className="px-4 py-3 text-right font-medium">Сумма</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((tx) => (
              <tr key={tx.id} className="transition-colors hover:bg-muted/40">
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {new Date(tx.date).toLocaleDateString("ru-RU")}
                </td>
                <td className="px-4 py-3">{tx.description || "—"}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {tx.category?.name ?? "Без категории"}
                  </span>
                </td>
                <td
                  className={`px-4 py-3 text-right font-medium tabular-nums ${
                    tx.type === "INCOME" ? "text-success" : "text-danger"
                  }`}
                >
                  {tx.type === "INCOME" ? "+" : "-"}
                  {formatAmount(tx.amountCents, tx.currency)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => startTransition(() => deleteTransaction(tx.id))}
                    className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
