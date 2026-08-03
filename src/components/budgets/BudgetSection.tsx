"use client";

import { useState, useTransition } from "react";
import { createBudget, deleteBudget } from "@/lib/actions/budgets";

interface BudgetWithSpent {
  id: string;
  name: string;
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

  const fieldClass =
    "rounded-lg border border-border bg-card px-2.5 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

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
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название бюджета"
          className={fieldClass}
        />
        <input
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          type="number"
          step="0.01"
          placeholder="Лимит"
          className={`w-28 ${fieldClass}`}
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={fieldClass}
        >
          <option value="">Все категории</option>
          {expenseCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={isPending || !name.trim() || !limit}
          onClick={onAdd}
          className="rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          Добавить бюджет
        </button>
      </div>
    </div>
  );
}
