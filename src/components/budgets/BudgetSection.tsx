"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { createBudget, deleteBudget, updateBudget } from "@/lib/actions/budgets";
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

interface BudgetWithSpent {
  id: string;
  name: string;
  categoryId: string | null;
  categoryName: string;
  limit: number;
  spent: number;
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
}: {
  budgets: BudgetWithSpent[];
  categories: Category[];
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  const [editing, setEditing] = useState<BudgetWithSpent | null>(null);
  const [editName, setEditName] = useState("");
  const [editLimit, setEditLimit] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditPending, startEditTransition] = useTransition();

  const onAdd = () => {
    if (!name.trim() || !limit) return;
    startTransition(async () => {
      await createBudget({
        name: name.trim(),
        limit: Number(limit),
        categoryId: categoryId || null,
        periodStart: new Date(firstOfMonth()),
        periodEnd: new Date(lastOfMonth()),
      });
      setName("");
      setLimit("");
      setCategoryId("");
    });
  };

  const openEdit = (b: BudgetWithSpent) => {
    setEditing(b);
    setEditName(b.name);
    setEditLimit(String(b.limit));
    setEditCategoryId(b.categoryId ?? "");
    setEditError(null);
  };

  const onSaveEdit = () => {
    if (!editing || !editName.trim() || !editLimit) return;
    setEditError(null);
    startEditTransition(async () => {
      try {
        await updateBudget({
          id: editing.id,
          name: editName.trim(),
          limit: Number(editLimit),
          categoryId: editCategoryId || null,
          periodStart: editing.periodStart,
          periodEnd: editing.periodEnd,
        });
        setEditing(null);
      } catch (err) {
        setEditError(err instanceof Error ? err.message : "Не удалось сохранить бюджет");
      }
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold">Бюджеты (текущий месяц)</h2>

      <div className="mb-4 space-y-3">
        {budgets.length === 0 && (
          <p className="text-sm text-muted-foreground">Бюджетов пока нет.</p>
        )}
        {budgets.map((b) => {
          const pct = b.limit > 0 ? Math.min(100, (b.spent / b.limit) * 100) : 0;
          const over = b.spent > b.limit;
          return (
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
                    className={`tabular-nums ${over ? "font-medium text-danger" : "text-muted-foreground"}`}
                  >
                    {b.spent.toFixed(2)} / {b.limit.toFixed(2)}
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
                    onClick={() => startTransition(() => deleteBudget(b.id))}
                    className="text-xs text-muted-foreground transition-colors hover:text-danger"
                  >
                    Удалить
                  </button>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${over ? "bg-danger" : "bg-primary"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название бюджета"
          className="w-auto"
        />
        <Input
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          type="number"
          step="0.01"
          placeholder="Лимит"
          className="w-28"
        />
        <Select value={categoryId || "none"} onValueChange={(v) => setCategoryId(v === "none" ? "" : v)}>
          <SelectTrigger className="w-44">
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
            {editError && <p className="text-xs text-danger">{editError}</p>}
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
    </div>
  );
}
