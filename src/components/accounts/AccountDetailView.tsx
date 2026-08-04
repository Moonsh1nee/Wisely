"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { archiveAccount, deleteAccount } from "@/lib/actions/accounts";
import { formatMoney } from "@/lib/format";
import { groupByDateLabel } from "@/lib/date-groups";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TransactionRow, type TransactionRowItem } from "@/components/transactions/TransactionRow";
import { BalanceTrendChart } from "@/components/charts/BalanceTrendChart";
import { AccountFormDialog, type EditableAccount } from "@/components/accounts/AccountFormDialog";
import { TransferDialog } from "@/components/accounts/TransferDialog";
import type { GoalProgress } from "@/lib/goal-calc";

interface HistoryItem {
  kind: "transaction" | "transfer";
  id: string;
  date: Date;
  amountCents: number;
  currency: string;
  description: string | null;
  type?: "INCOME" | "EXPENSE";
  category?: { name: string; icon: string | null } | null;
  direction?: "in" | "out";
  counterpartyName?: string;
}

export interface AccountDetail {
  id: string;
  name: string;
  currency: string;
  color: string | null;
  accountType: "CHECKING" | "SAVINGS";
  initialBalance: number;
  balance: number;
  goalAmount: number | null;
  goalDate: Date | null;
  goalProgress: GoalProgress | null;
  history: HistoryItem[];
}

export function AccountDetailView({
  account,
  balanceHistory,
  allAccounts,
  defaultCurrency,
}: {
  account: AccountDetail;
  balanceHistory: { month: string; balance: number }[];
  allAccounts: { id: string; name: string; currency: string }[];
  defaultCurrency: string;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const editableAccount: EditableAccount = {
    id: account.id,
    name: account.name,
    currency: account.currency,
    initialBalance: account.initialBalance,
    accountType: account.accountType,
    color: account.color,
    goalAmount: account.goalAmount,
    goalDate: account.goalDate,
  };

  const onArchive = () => {
    startTransition(async () => {
      try {
        await archiveAccount(account.id);
        toast.success("Счёт архивирован");
        router.push("/accounts");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось архивировать счёт");
      }
    });
  };

  const onDelete = () => {
    startTransition(async () => {
      try {
        await deleteAccount(account.id);
        toast.success("Счёт удалён");
        router.push("/accounts");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось удалить счёт");
      }
    });
  };

  const historyGroups = groupByDateLabel(account.history, (item) => new Date(item.date));

  return (
    <>
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/accounts">
            <ArrowLeft className="h-4 w-4" /> Счета
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{account.name}</CardTitle>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="text-muted-foreground transition-colors hover:text-primary"
              aria-label="Изменить счёт"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <p className="text-3xl font-semibold tabular-nums">{formatMoney(account.balance, account.currency)}</p>
            <p className="text-xs text-muted-foreground">
              {account.accountType === "SAVINGS" ? "Накопительный счёт" : "Обычный счёт"}
            </p>
          </div>

          {account.goalProgress && account.goalAmount && (
            <div className="space-y-1.5">
              <Progress value={account.goalProgress.percent} />
              <p className="text-sm text-muted-foreground">
                Накоплено {formatMoney(account.balance, account.currency)} из{" "}
                {formatMoney(account.goalAmount, account.currency)}
                {account.goalProgress.isReached && " · Цель достигнута 🎉"}
              </p>
            </div>
          )}

          <BalanceTrendChart data={balanceHistory} currency={account.currency} />

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setTransferOpen(true)}>
              Перевести
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={onArchive}>
              Архивировать
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={onDelete}
              className="text-danger hover:bg-danger/10 hover:text-danger"
            >
              Удалить
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>История операций</CardTitle>
        </CardHeader>
        <CardContent>
          {historyGroups.length === 0 && (
            <p className="text-sm text-muted-foreground">Операций по этому счёту пока нет.</p>
          )}
          <div className="flex flex-col gap-3">
            {historyGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-1 px-3 text-xs font-medium text-muted-foreground">{group.label}</p>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <TransactionRow key={item.id} item={item as TransactionRowItem} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AccountFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        defaultCurrency={defaultCurrency}
        account={editableAccount}
      />
      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        accounts={allAccounts}
        defaultFromAccountId={account.id}
      />
    </>
  );
}
