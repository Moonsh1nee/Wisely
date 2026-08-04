"use client";

import { ArrowDownRight, ArrowUpRight, ArrowLeftRight, Trash2 } from "lucide-react";
import { formatMoney } from "@/lib/format";

export type TransactionRowItem =
  | {
      kind: "transaction";
      id: string;
      type: "INCOME" | "EXPENSE";
      amountCents: number;
      currency: string;
      description: string | null;
      category: { name: string; icon: string | null } | null;
      accountName?: string | null;
    }
  | {
      kind: "transfer";
      id: string;
      amountCents: number;
      currency: string;
      description: string | null;
      direction: "in" | "out";
      counterpartyName: string;
    };

function RowIcon({ item }: { item: TransactionRowItem }) {
  if (item.kind === "transfer") {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <ArrowLeftRight className="h-4 w-4" />
      </span>
    );
  }
  if (item.category?.icon) {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-lg leading-none">
        <span className="-translate-y-px">{item.category.icon}</span>
      </span>
    );
  }
  const Icon = item.type === "INCOME" ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
        item.type === "INCOME" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
      }`}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

function rowTitle(item: TransactionRowItem): string {
  if (item.kind === "transfer") {
    return item.direction === "out" ? `Перевод → ${item.counterpartyName}` : `Перевод ← ${item.counterpartyName}`;
  }
  return item.description || item.category?.name || "Без описания";
}

function rowSubtitle(item: TransactionRowItem): string | null {
  if (item.kind === "transfer") return item.description;
  const parts = [
    item.description ? item.category?.name : null,
    item.accountName,
  ].filter((p): p is string => Boolean(p));
  return parts.length > 0 ? parts.join(" · ") : null;
}

function isPositive(item: TransactionRowItem): boolean {
  if (item.kind === "transfer") return item.direction === "in";
  return item.type === "INCOME";
}

export function TransactionRow({
  item,
  onClick,
  onDelete,
}: {
  item: TransactionRowItem;
  onClick?: () => void;
  onDelete?: () => void;
}) {
  const positive = isPositive(item);
  const subtitle = rowSubtitle(item);

  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
        onClick ? "cursor-pointer hover:bg-muted/50" : ""
      }`}
    >
      <RowIcon item={item} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{rowTitle(item)}</p>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <span className={`shrink-0 tabular-nums font-medium ${positive ? "text-success" : "text-danger"}`}>
        {positive ? "+" : "-"}
        {formatMoney(item.amountCents / 100, item.currency)}
      </span>
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Удалить"
          className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
