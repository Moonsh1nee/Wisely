"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteTransaction } from "@/lib/actions/transactions";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
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

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Дата</TableHead>
            <TableHead>Описание</TableHead>
            <TableHead>Категория</TableHead>
            <TableHead>Счёт</TableHead>
            <TableHead className="text-right">Сумма</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell className="text-muted-foreground">
                {new Date(tx.date).toLocaleDateString("ru-RU")}
              </TableCell>
              <TableCell className="whitespace-normal">{tx.description || "—"}</TableCell>
              <TableCell>
                <Badge variant="outline">{tx.category?.name ?? "Без категории"}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {tx.account?.name ?? "—"}
              </TableCell>
              <TableCell
                className={`text-right font-medium tabular-nums ${
                  tx.type === "INCOME" ? "text-success" : "text-danger"
                }`}
              >
                {tx.type === "INCOME" ? "+" : "-"}
                {formatMoney(tx.amountCents / 100, tx.currency)}
              </TableCell>
              <TableCell className="text-right">
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
                    onClick={() => onDelete(tx)}
                    className="text-muted-foreground hover:bg-danger/10 hover:text-danger"
                  >
                    Удалить
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
