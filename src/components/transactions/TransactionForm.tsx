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

  const fieldClass =
    "rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
  const labelClass = "text-xs font-medium text-muted-foreground";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
        Новая транзакция
      </h2>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Тип</label>
          <select {...register("type")} className={fieldClass}>
            <option value="EXPENSE">Расход</option>
            <option value="INCOME">Доход</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Сумма</label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("amount")}
            className={`w-28 ${fieldClass}`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Категория</label>
          <select {...register("categoryId")} className={fieldClass}>
            <option value="">Без категории</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Дата</label>
          <input type="date" {...register("date")} className={fieldClass} />
        </div>

        <div className="flex min-w-[10rem] flex-1 flex-col gap-1.5">
          <label className={labelClass}>Описание</label>
          <input
            placeholder="Необязательно"
            {...register("description")}
            className={`w-full ${fieldClass}`}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {isPending ? "Сохранение..." : "Добавить"}
        </button>
      </div>

      {(errors.amount || error) && (
        <p className="mt-3 text-sm text-danger">{errors.amount?.message ?? error}</p>
      )}
    </form>
  );
}
