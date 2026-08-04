"use client";

import { useEffect, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createTransaction, updateTransaction } from "@/lib/actions/transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  type: z.enum(["EXPENSE", "INCOME"]),
  amount: z.coerce.number().positive("Сумма должна быть больше нуля"),
  accountId: z.string().optional(),
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

interface Account {
  id: string;
  name: string;
  currency: string;
}

export interface EditableTransaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  accountId: string | null;
  categoryId: string | null;
  description: string | null;
  date: string;
}

interface TransactionFormProps {
  categories: Category[];
  accounts?: Account[];
  transaction?: EditableTransaction;
  onDone?: () => void;
}

export function TransactionForm({ categories, accounts = [], transaction, onDone }: TransactionFormProps) {
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);
  const isEdit = Boolean(transaction);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: transaction
      ? {
          type: transaction.type,
          amount: transaction.amount,
          accountId: transaction.accountId ?? "",
          categoryId: transaction.categoryId ?? "",
          description: transaction.description ?? "",
          date: transaction.date,
        }
      : { type: "EXPENSE", date: today },
  });

  useEffect(() => {
    if (transaction) {
      reset({
        type: transaction.type,
        amount: transaction.amount,
        accountId: transaction.accountId ?? "",
        categoryId: transaction.categoryId ?? "",
        description: transaction.description ?? "",
        date: transaction.date,
      });
    }
  }, [transaction, reset]);

  const selectedType = watch("type");
  const filteredCategories = categories.filter((c) => c.type === selectedType);

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        if (isEdit && transaction) {
          await updateTransaction({
            id: transaction.id,
            ...data,
            date: new Date(data.date),
            accountId: data.accountId || null,
            categoryId: data.categoryId || null,
          });
          toast.success("Транзакция сохранена");
          onDone?.();
        } else {
          await createTransaction({
            ...data,
            date: new Date(data.date),
            accountId: data.accountId || null,
            categoryId: data.categoryId || null,
          });
          toast.success("Транзакция добавлена");
          reset({ type: data.type, date: today });
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось сохранить транзакцию");
      }
    });
  };

  const fields = (
    <div className={isEdit ? "flex flex-col gap-3" : "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"}>
      <div className="flex flex-col gap-1.5">
        <Label>Тип</Label>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className={isEdit ? "" : "w-full sm:w-36"}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPENSE">Расход</SelectItem>
                <SelectItem value="INCOME">Доход</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Сумма</Label>
        <Input
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register("amount")}
          className={isEdit ? "" : "w-full sm:w-28"}
        />
      </div>

      {accounts.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label>Счёт</Label>
          <Controller
            control={control}
            name="accountId"
            render={({ field }) => (
              <Select
                value={field.value || "none"}
                onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
              >
                <SelectTrigger className={isEdit ? "" : "w-full sm:w-40"}>
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
            )}
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label>Категория</Label>
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
              <SelectTrigger className={isEdit ? "" : "w-full sm:w-40"}>
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
          )}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Дата</Label>
        <Input type="date" {...register("date")} className={isEdit ? "" : "w-full sm:w-auto"} />
      </div>

      <div className={isEdit ? "flex flex-col gap-1.5" : "flex w-full flex-col gap-1.5 sm:min-w-40 sm:flex-1"}>
        <Label>Описание</Label>
        <Input placeholder="Необязательно" {...register("description")} />
      </div>

      <Button type="submit" disabled={isPending} className={isEdit ? "" : "w-full sm:w-auto"}>
        {isPending ? "Сохранение..." : isEdit ? "Сохранить" : "Добавить"}
      </Button>
    </div>
  );

  if (isEdit) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {fields}
        {errors.amount && <p className="text-sm text-danger">{errors.amount.message}</p>}
      </form>
    );
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
            Новая транзакция
          </h2>
          {fields}
          {errors.amount && <p className="mt-3 text-sm text-danger">{errors.amount.message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
