"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createTransaction } from "@/lib/actions/transactions";

const formSchema = z.object({
  type: z.enum(["EXPENSE", "INCOME"]),
  amount: z.coerce.number().positive("Сумма должна быть больше нуля"),
  categoryId: z.string().optional(),
  description: z.string().max(500).optional(),
  date: z.string().min(1),
});

type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
}

export function TransactionForm({ categories }: { categories: Category[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: "EXPENSE", date: today },
  });

  const selectedType = watch("type");
  const filteredCategories = categories.filter((c) => c.type === selectedType);

  const onSubmit = (data: FormValues) => {
    setError(null);
    startTransition(async () => {
      try {
        await createTransaction({
          ...data,
          date: new Date(data.date),
          categoryId: data.categoryId || null,
        });
        reset({ type: data.type, date: today });
      } catch {
        setError("Не удалось сохранить транзакцию");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-wrap items-end gap-2 rounded border p-4"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Тип</label>
        <select {...register("type")} className="rounded border px-2 py-1.5">
          <option value="EXPENSE">Расход</option>
          <option value="INCOME">Доход</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Сумма</label>
        <input
          type="number"
          step="0.01"
          {...register("amount")}
          className="w-28 rounded border px-2 py-1.5"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Категория</label>
        <select {...register("categoryId")} className="rounded border px-2 py-1.5">
          <option value="">Без категории</option>
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Дата</label>
        <input type="date" {...register("date")} className="rounded border px-2 py-1.5" />
      </div>

      <div className="flex flex-1 min-w-[10rem] flex-col gap-1">
        <label className="text-xs text-gray-500">Описание</label>
        <input {...register("description")} className="w-full rounded border px-2 py-1.5" />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-black px-4 py-1.5 text-white disabled:opacity-50"
      >
        {isPending ? "Сохранение..." : "Добавить"}
      </button>

      {(errors.amount || error) && (
        <p className="w-full text-sm text-red-600">
          {errors.amount?.message ?? error}
        </p>
      )}
    </form>
  );
}
