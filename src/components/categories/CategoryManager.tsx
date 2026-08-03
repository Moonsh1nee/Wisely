"use client";

import { useState, useTransition } from "react";
import { createCategory, deleteCategory } from "@/lib/actions/categories";

interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onAdd = () => {
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await createCategory({ name: name.trim(), type });
        setName("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось создать категорию");
      }
    });
  };

  const fieldClass =
    "rounded-lg border border-border bg-card px-2.5 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold">Категории</h2>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">Категорий пока нет.</p>
        )}
        {categories.map((c) => (
          <span
            key={c.id}
            className="flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                c.type === "INCOME" ? "bg-success" : "bg-danger"
              }`}
            />
            {c.name}
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => deleteCategory(c.id))}
              className="text-muted-foreground transition-colors hover:text-danger"
              aria-label={`Удалить категорию ${c.name}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "EXPENSE" | "INCOME")}
          className={fieldClass}
        >
          <option value="EXPENSE">Расход</option>
          <option value="INCOME">Доход</option>
        </select>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          placeholder="Название категории"
          className={`flex-1 ${fieldClass}`}
        />
        <button
          type="button"
          disabled={isPending || !name.trim()}
          onClick={onAdd}
          className="rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          Добавить
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
