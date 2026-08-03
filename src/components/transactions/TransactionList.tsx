"use client";

import { useState, useTransition } from "react";
import { deleteTransaction } from "@/lib/actions/transactions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionForm } from "@/components/transactions/TransactionForm";

interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
}

interface Account {
  id: string;
  name: string;
  currency: string;
}

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amountCents: number;
  currency: string;
  description: string | null;
  date: Date;
  categoryId: string | null;
  category: { name: string } | null;
  accountId: string | null;
  account: { name: string } | null;
}

function formatAmount(amountCents: number, currency: string) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency }).format(
    amountCents / 100,
  );
}

export function TransactionList({
  transactions,
  categories,
  accounts = [],
}: {
  transactions: Transaction[];
  categories: Category[];
  accounts?: Account[];
}) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Transaction | null>(null);

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
              <th className="px-4 py-3 font-medium">Счёт</th>
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
                <td className="px-4 py-3 text-muted-foreground">
                  {tx.account?.name ?? "—"}
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
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(tx)}
                    >
                      Изменить
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => startTransition(() => deleteTransaction(tx.id))}
                      className="text-muted-foreground hover:bg-danger/10 hover:text-danger"
                    >
                      Удалить
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать транзакцию</DialogTitle>
          </DialogHeader>
          {editing && (
            <TransactionForm
              categories={categories}
              accounts={accounts}
              transaction={{
                id: editing.id,
                type: editing.type,
                amount: editing.amountCents / 100,
                accountId: editing.accountId,
                categoryId: editing.categoryId,
                description: editing.description,
                date: new Date(editing.date).toISOString().slice(0, 10),
              }}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
