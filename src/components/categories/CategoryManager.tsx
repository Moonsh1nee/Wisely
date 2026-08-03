"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { createCategory, deleteCategory, updateCategory } from "@/lib/actions/categories";
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

  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditPending, startEditTransition] = useTransition();

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

  const openEdit = (c: Category) => {
    setEditing(c);
    setEditName(c.name);
    setEditType(c.type);
    setEditError(null);
  };

  const onSaveEdit = () => {
    if (!editing || !editName.trim()) return;
    setEditError(null);
    startEditTransition(async () => {
      try {
        await updateCategory({ id: editing.id, name: editName.trim(), type: editType });
        setEditing(null);
      } catch (err) {
        setEditError(err instanceof Error ? err.message : "Не удалось сохранить категорию");
      }
    });
  };

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
              onClick={() => openEdit(c)}
              className="text-muted-foreground transition-colors hover:text-primary"
              aria-label={`Изменить категорию ${c.name}`}
            >
              <Pencil className="h-3 w-3" />
            </button>
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
        <Select value={type} onValueChange={(v) => setType(v as "EXPENSE" | "INCOME")}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EXPENSE">Расход</SelectItem>
            <SelectItem value="INCOME">Доход</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          placeholder="Название категории"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          disabled={isPending || !name.trim()}
          onClick={onAdd}
        >
          Добавить
        </Button>
      </div>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать категорию</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Название</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Тип</Label>
              <Select value={editType} onValueChange={(v) => setEditType(v as "EXPENSE" | "INCOME")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Расход</SelectItem>
                  <SelectItem value="INCOME">Доход</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editError && <p className="text-xs text-danger">{editError}</p>}
            <Button
              type="button"
              disabled={isEditPending || !editName.trim()}
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
