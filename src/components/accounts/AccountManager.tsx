"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import {
  createAccount,
  deleteAccount,
  updateAccount,
} from "@/lib/actions/accounts";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AccountWithBalance {
  id: string;
  name: string;
  currency: string;
  color: string | null;
  icon: string | null;
  initialBalance: number;
  balance: number;
}

function formatAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("ru-RU", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function AccountManager({
  accounts,
  defaultCurrency,
}: {
  accounts: AccountWithBalance[];
  defaultCurrency: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [initialBalance, setInitialBalance] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<AccountWithBalance | null>(null);
  const [editName, setEditName] = useState("");
  const [editCurrency, setEditCurrency] = useState("");
  const [editInitialBalance, setEditInitialBalance] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditPending, startEditTransition] = useTransition();

  const onAdd = () => {
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await createAccount({
          name: name.trim(),
          currency,
          initialBalance: initialBalance ? Number(initialBalance) : 0,
        });
        setName("");
        setInitialBalance("");
        setCurrency(defaultCurrency);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось создать счёт");
      }
    });
  };

  const openEdit = (a: AccountWithBalance) => {
    setEditing(a);
    setEditName(a.name);
    setEditCurrency(a.currency);
    setEditInitialBalance(String(a.initialBalance));
    setEditError(null);
  };

  const onSaveEdit = () => {
    if (!editing || !editName.trim()) return;
    setEditError(null);
    startEditTransition(async () => {
      try {
        await updateAccount({
          id: editing.id,
          name: editName.trim(),
          currency: editCurrency,
          initialBalance: editInitialBalance ? Number(editInitialBalance) : 0,
        });
        setEditing(null);
      } catch (err) {
        setEditError(err instanceof Error ? err.message : "Не удалось сохранить счёт");
      }
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold">Счета и карты</h2>

      <div className="mb-4 space-y-2">
        {accounts.length === 0 && (
          <p className="text-sm text-muted-foreground">Счетов пока нет. Добавьте первый ниже.</p>
        )}
        {accounts.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-2.5"
          >
            <div>
              <p className="text-sm font-medium">{a.name}</p>
              <p className="text-xs text-muted-foreground">{a.currency}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="tabular-nums font-medium">
                {formatAmount(a.balance, a.currency)}
              </span>
              <button
                type="button"
                onClick={() => openEdit(a)}
                className="text-muted-foreground transition-colors hover:text-primary"
                aria-label={`Изменить счёт ${a.name}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => startTransition(() => deleteAccount(a.id))}
                className="text-xs text-muted-foreground transition-colors hover:text-danger"
                aria-label={`Удалить счёт ${a.name}`}
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          placeholder="Название счёта"
          className="w-auto flex-1 min-w-[10rem]"
        />
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={initialBalance}
          onChange={(e) => setInitialBalance(e.target.value)}
          type="number"
          step="0.01"
          placeholder="Начальный баланс"
          className="w-40"
        />
        <Button
          type="button"
          variant="outline"
          disabled={isPending || !name.trim()}
          onClick={onAdd}
        >
          Добавить
        </Button>
      </div>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать счёт</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Название</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Валюта</Label>
              <Select value={editCurrency} onValueChange={setEditCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Начальный баланс</Label>
              <Input
                type="number"
                step="0.01"
                value={editInitialBalance}
                onChange={(e) => setEditInitialBalance(e.target.value)}
              />
            </div>
            {editError && <p className="text-xs text-danger">{editError}</p>}
            <Button
              type="button"
              disabled={isEditPending || !editName.trim()}
              onClick={onSaveEdit}
            >
              {isEditPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
