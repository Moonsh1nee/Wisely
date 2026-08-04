"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteTransaction } from "@/lib/actions/transactions";
import { groupByDateLabel } from "@/lib/date-groups";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionRow } from "@/components/transactions/TransactionRow";

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
  category: { name: string; icon: string | null } | null;
  accountId: string | null;
  account: { name: string } | null;
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
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<Transaction | null>(null);

  const onDelete = (tx: Transaction) => {
    startTransition(async () => {
      try {
        await deleteTransaction(tx.id);
        toast.success("Транзакция удалена");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось удалить транзакцию");
      }
    });
  };

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

  const groups = groupByDateLabel(transactions, (tx) => new Date(tx.date));

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-sm">
      <div className="flex flex-col gap-3">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-3 pt-1 text-xs font-medium text-muted-foreground">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  item={{
                    kind: "transaction",
                    id: tx.id,
                    type: tx.type,
                    amountCents: tx.amountCents,
                    currency: tx.currency,
                    description: tx.description,
                    category: tx.category,
                    accountName: tx.account?.name,
                  }}
                  onClick={() => setEditing(tx)}
                  onDelete={() => onDelete(tx)}
                />
              ))}
            </div>
          </div>
        ))}
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
