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

  return (
    <div className="rounded border p-4">
      <h2 className="mb-3 font-medium">Бюджеты (текущий месяц)</h2>

      <div className="mb-4 space-y-2">
        {budgets.length === 0 && (
          <p className="text-sm text-gray-500">Бюджетов пока нет.</p>
        )}
        {budgets.map((b) => {
          const pct = b.limit > 0 ? Math.min(100, (b.spent / b.limit) * 100) : 0;
          const over = b.spent > b.limit;
          return (
            <div key={b.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {b.name} <span className="text-gray-400">({b.categoryName})</span>
                </span>
                <span className={over ? "text-red-600" : "text-gray-600"}>
                  {b.spent.toFixed(2)} / {b.limit.toFixed(2)}
                </span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => startTransition(() => deleteBudget(b.id))}
                  className="text-xs text-gray-400 hover:text-red-600"
                >
                  Удалить
                </button>
              </div>
              <div className="h-2 w-full overflow-hidden rounded bg-gray-100">
                <div
                  className={`h-full ${over ? "bg-red-500" : "bg-black"}`}
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
          className="rounded border px-2 py-1.5 text-sm"
        />
        <input
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          type="number"
          step="0.01"
          placeholder="Лимит"
          className="w-28 rounded border px-2 py-1.5 text-sm"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded border px-2 py-1.5 text-sm"
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
          disabled={isPending}
          onClick={onAdd}
          className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Добавить бюджет
        </button>
      </div>
    </div>
  );
}
