"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { createAccount, updateAccount } from "@/lib/actions/accounts";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import { ACCOUNT_COLOR_PRESETS, accountCardGradient } from "@/lib/account-colors";
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

export interface EditableAccount {
  id: string;
  name: string;
  currency: string;
  initialBalance: number;
  accountType: "CHECKING" | "SAVINGS";
  color: string | null;
  goalAmount: number | null;
  goalDate: Date | null;
}

export function AccountFormDialog({
  open,
  onOpenChange,
  defaultCurrency,
  account,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCurrency: string;
  account?: EditableAccount;
  onSaved?: () => void;
}) {
  const isEdit = Boolean(account);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [initialBalance, setInitialBalance] = useState("");
  const [accountType, setAccountType] = useState<"CHECKING" | "SAVINGS">("CHECKING");
  const [color, setColor] = useState<string>(ACCOUNT_COLOR_PRESETS[0].key);
  const [goalAmount, setGoalAmount] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the form to the target account's values when the dialog opens, no external system to sync from
    setName(account?.name ?? "");
    setCurrency(account?.currency ?? defaultCurrency);
    setInitialBalance(account ? String(account.initialBalance) : "");
    setAccountType(account?.accountType ?? "CHECKING");
    setColor(account?.color ?? ACCOUNT_COLOR_PRESETS[0].key);
    setGoalAmount(account?.goalAmount ? String(account.goalAmount) : "");
    setGoalDate(account?.goalDate ? new Date(account.goalDate).toISOString().slice(0, 10) : "");
  }, [open, account, defaultCurrency]);

  const onSave = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        const payload = {
          name: name.trim(),
          currency,
          initialBalance: initialBalance ? Number(initialBalance) : 0,
          accountType,
          color,
          goalAmount: accountType === "SAVINGS" && goalAmount ? Number(goalAmount) : null,
          goalDate: accountType === "SAVINGS" && goalDate ? new Date(goalDate) : null,
        };
        if (isEdit && account) {
          await updateAccount({ id: account.id, ...payload });
          toast.success("Счёт сохранён");
        } else {
          await createAccount(payload);
          toast.success("Счёт создан");
        }
        onOpenChange(false);
        onSaved?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось сохранить счёт");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Редактировать счёт" : "Новый счёт"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Название</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Тип счёта</Label>
            <Select value={accountType} onValueChange={(v) => setAccountType(v as "CHECKING" | "SAVINGS")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CHECKING">Обычный</SelectItem>
                <SelectItem value="SAVINGS">Накопительный (копилка)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Валюта</Label>
            <Select value={currency} onValueChange={setCurrency}>
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
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Цвет карточки</Label>
            <div className="flex gap-2">
              {ACCOUNT_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  aria-label={preset.label}
                  onClick={() => setColor(preset.key)}
                  className={`h-7 w-7 rounded-full transition-all ${
                    color === preset.key ? "ring-2 ring-offset-2 ring-offset-card ring-foreground" : ""
                  }`}
                  style={{ backgroundImage: accountCardGradient(preset.key) }}
                />
              ))}
            </div>
          </div>

          {accountType === "SAVINGS" && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>Цель — сумма (необязательно)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Без цели"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Цель — дата (необязательно)</Label>
                <Input type="date" value={goalDate} onChange={(e) => setGoalDate(e.target.value)} />
              </div>
            </>
          )}

          <Button type="button" disabled={isPending || !name.trim()} onClick={onSave}>
            {isPending ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
