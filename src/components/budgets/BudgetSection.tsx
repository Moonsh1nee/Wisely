"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { createBudget, deleteBudget, updateBudget } from "@/lib/actions/budgets";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

interface BudgetWithSpent {
  id: string;
  name: string;
  categoryId: string | null;
  categoryName: string;
  currency: string;
  limit: number;
  spent: number;
  percentUsed: number;
  isOverBudget: boolean;
  periodStart: Date;
  periodEnd: Date;
}

interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
}

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function lastOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

export function BudgetSection({
  budgets,
  categories,
  defaultCurrency,
}: {
  budgets: BudgetWithSpent[];
  categories: Category[];
  defaultCurrency: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [categoryId, setCategoryId] = useState("");
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  const [editing, setEditing] = useState<BudgetWithSpent | null>(null);
  const [editName, setEditName] = useState("");
  const [editLimit, setEditLimit] = useState("");
  const [editCurrency, setEditCurrency] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [isEditPending, startEditTransition] = useTransition();

  const onAdd = () => {
    if (!name.trim() || !limit) return;
    startTransition(async () => {
      try {
        await createBudget({
          name: name.trim(),
          limit: Number(limit),
          currency,
          categoryId: categoryId || null,
          periodStart: new Date(firstOfMonth()),
          periodEnd: new Date(lastOfMonth()),
        });
        toast.success("Бюджет создан");
        setName("");
        setLimit("");
        setCurrency(defaultCurrency);
        setCategoryId("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось создать бюджет");
      }
    });
  };

  const openEdit = (b: BudgetWithSpent) => {
    setEditing(b);
    setEditName(b.name);
    setEditLimit(String(b.limit));
    setEditCurrency(b.currency);
    setEditCategoryId(b.categoryId ?? "");
  };

  const onSaveEdit = () => {
    if (!editing || !editName.trim() || !editLimit) return;
    startEditTransition(async () => {
      try {
        await updateBudget({
          id: editing.id,
          name: editName.trim(),
          limit: Number(editLimit),
          currency: editCurrency,
          categoryId: editCategoryId || null,
          periodStart: editing.periodStart,
          periodEnd: editing.periodEnd,
        });
        toast.success("Бюджет сохранён");
        setEditing(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось сохранить бюджет");
      }
    });
  };

  const onDelete = (b: BudgetWithSpent) => {
    startTransition(async () => {
      try {
        await deleteBudget(b.id);
        toast.success(`Бюджет «${b.name}» удалён`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось удалить бюджет");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Бюджеты (текущий месяц)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-3">
          {budgets.length === 0 && (
            <p className="text-sm text-muted-foreground">Бюджетов пока нет.</p>
          )}
          {budgets.map((b) => (
            <div key={b.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {b.name}{" "}
                  <span className="font-normal text-muted-foreground">
                    ({b.categoryName})
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`tabular-nums ${b.isOverBudget ? "font-medium text-danger" : "text-muted-foreground"}`}
                  >
                    {formatMoney(b.spent, b.currency)} / {formatMoney(b.limit, b.currency)}
                  </span>
                  <button
                    type="button"
                    onClick={() => openEdit(b)}
                    className="text-muted-foreground transition-colors hover:text-primary"
                    aria-label={`Изменить бюджет ${b.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => onDelete(b)}
                    className="text-xs text-muted-foreground transition-colors hover:text-danger"
                  >
                    Удалить
                  </button>
                </div>
              </div>
              <Progress
                value={b.percentUsed}
                className={`**:data-[slot=progress-track]:h-2 ${
                  b.isOverBudget ? "[--color-primary:var(--danger)]" : ""
                }`}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название бюджета"
            className="w-full sm:w-auto"
          />
          <Input
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            type="number"
            step="0.01"
            placeholder="Лимит"
            className="w-full sm:w-28"
          />
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-full sm:w-32">
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
          <Select value={categoryId || "none"} onValueChange={(v) => setCategoryId(v === "none" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Все категории" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Все категории</SelectItem>
              {expenseCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            disabled={isPending || !name.trim() || !limit}
            onClick={onAdd}
          >
            Добавить бюджет
          </Button>
        </div>

        <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактировать бюджет</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Название</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Лимит</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editLimit}
                  onChange={(e) => setEditLimit(e.target.value)}
                />
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
                <Label>Категория</Label>
                <Select
                  value={editCategoryId || "none"}
                  onValueChange={(v) => setEditCategoryId(v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Все категории" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Все категории</SelectItem>
                    {expenseCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                disabled={isEditPending || !editName.trim() || !editLimit}
                onClick={onSaveEdit}
              >
                {isEditPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
