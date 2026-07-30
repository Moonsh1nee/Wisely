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
      <p className="rounded border border-dashed p-6 text-center text-sm text-gray-500">
        Транзакций пока нет. Добавьте первую выше.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="p-2">Дата</th>
            <th className="p-2">Описание</th>
            <th className="p-2">Категория</th>
            <th className="p-2 text-right">Сумма</th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-t">
              <td className="p-2 whitespace-nowrap">
                {new Date(tx.date).toLocaleDateString("ru-RU")}
              </td>
              <td className="p-2">{tx.description || "—"}</td>
              <td className="p-2">{tx.category?.name ?? "Без категории"}</td>
              <td
                className={`p-2 text-right font-medium ${
                  tx.type === "INCOME" ? "text-green-600" : "text-red-600"
                }`}
              >
                {tx.type === "INCOME" ? "+" : "-"}
                {formatAmount(tx.amountCents, tx.currency)}
              </td>
              <td className="p-2 text-right">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => startTransition(() => deleteTransaction(tx.id))}
                  className="text-xs text-gray-400 hover:text-red-600 disabled:opacity-50"
                >
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
