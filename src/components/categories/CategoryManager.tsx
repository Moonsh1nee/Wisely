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
  const [isPending, startTransition] = useTransition();

  const onAdd = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      await createCategory({ name: name.trim(), type });
      setName("");
    });
  };

  return (
    <div className="rounded border p-4">
      <h2 className="mb-3 font-medium">Категории</h2>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {categories.length === 0 && (
          <p className="text-sm text-gray-500">Категорий пока нет.</p>
        )}
        {categories.map((c) => (
          <span
            key={c.id}
            className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
          >
            {c.name}
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => deleteCategory(c.id))}
              className="text-gray-400 hover:text-red-600"
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
          className="rounded border px-2 py-1.5 text-sm"
        >
          <option value="EXPENSE">Расход</option>
          <option value="INCOME">Доход</option>
        </select>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название категории"
          className="flex-1 rounded border px-2 py-1.5 text-sm"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={onAdd}
          className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Добавить
        </button>
      </div>
    </div>
  );
}
