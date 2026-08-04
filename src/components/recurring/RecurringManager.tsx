"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createRecurring, deleteRecurring } from "@/lib/actions/recurring";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface RecurringRow {
  id: string;
  type: "INCOME" | "EXPENSE";
  amountCents: number;
  currency: string;
  description: string | null;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  startDate: Date;
  endDate: Date | null;
  nextRunAt: Date;
  category: { name: string } | null;
  account: { name: string } | null;
}

const FREQUENCY_LABELS: Record<RecurringRow["frequency"], string> = {
  DAILY: "Ежедневно",
  WEEKLY: "Еженедельно",
  MONTHLY: "Ежемесячно",
  YEARLY: "Ежегодно",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function RecurringManager({
  recurring,
  categories,
  accounts,
  defaultCurrency,
}: {
  recurring: RecurringRow[];
  categories: Category[];
  accounts: Account[];
  defaultCurrency: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<RecurringRow["frequency"]>("MONTHLY");
  const [startDate, setStartDate] = useState(today());

  const filteredCategories = categories.filter((c) => c.type === type);

  const onAdd = () => {
    if (!amount) return;
    startTransition(async () => {
      try {
        await createRecurring({
          type,
          amount: Number(amount),
          currency,
          accountId: accountId || null,
          categoryId: categoryId || null,
          description: description || undefined,
          frequency,
          startDate: new Date(startDate),
        });
        toast.success("Повторяющаяся транзакция создана");
        setAmount("");
        setDescription("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось создать правило");
      }
    });
  };

  const onDelete = (r: RecurringRow) => {
    startTransition(async () => {
      try {
        await deleteRecurring(r.id);
        toast.success("Правило удалено");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось удалить правило");
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        {recurring.length === 0 && (
          <p className="text-sm text-muted-foreground">Повторяющихся транзакций пока нет.</p>
        )}
        {recurring.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/30 px-4 py-2.5"
          >
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 text-sm font-medium">
                {r.description || r.category?.name || "Без описания"}
                <Badge variant="outline">{FREQUENCY_LABELS[r.frequency]}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Следующее: {new Date(r.nextRunAt).toLocaleDateString("ru-RU")}
                {r.account ? ` · ${r.account.name}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`tabular-nums font-medium ${r.type === "INCOME" ? "text-success" : "text-danger"}`}
              >
                {r.type === "INCOME" ? "+" : "-"}
                {formatMoney(r.amountCents / 100, r.currency)}
              </span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => onDelete(r)}
                className="text-xs text-muted-foreground transition-colors hover:text-danger"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-col gap-1.5">
          <Label>Тип</Label>
          <Select value={type} onValueChange={(v) => setType(v as "EXPENSE" | "INCOME")}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EXPENSE">Расход</SelectItem>
              <SelectItem value="INCOME">Доход</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Сумма</Label>
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full sm:w-28"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Валюта</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-full sm:w-28">
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
        </div>
        {accounts.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label>Счёт</Label>
            <Select value={accountId || "none"} onValueChange={(v) => setAccountId(v === "none" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Без счёта" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без счёта</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label>Категория</Label>
          <Select value={categoryId || "none"} onValueChange={(v) => setCategoryId(v === "none" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Без категории" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Без категории</SelectItem>
              {filteredCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Периодичность</Label>
          <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurringRow["frequency"])}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(FREQUENCY_LABELS) as RecurringRow["frequency"][]).map((f) => (
                <SelectItem key={f} value={f}>
                  {FREQUENCY_LABELS[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Начало</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full sm:w-auto"
          />
        </div>
        <div className="flex w-full flex-col gap-1.5 sm:min-w-40 sm:flex-1">
          <Label>Описание</Label>
          <Input
            placeholder="Необязательно"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={isPending || !amount}
          onClick={onAdd}
          className="w-full sm:w-auto"
        >
          Добавить правило
        </Button>
      </div>
    </div>
  );
}
