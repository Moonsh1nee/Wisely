"use client";

import { useState, useTransition } from "react";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { createCategory, deleteCategory, updateCategory } from "@/lib/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const [isPending, startTransition] = useTransition();

  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [isEditPending, startEditTransition] = useTransition();

  const onAdd = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        await createCategory({ name: name.trim(), type });
        toast.success("Категория создана");
        setName("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось создать категорию");
      }
    });
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setEditName(c.name);
    setEditType(c.type);
  };

  const onSaveEdit = () => {
    if (!editing || !editName.trim()) return;
    startEditTransition(async () => {
      try {
        await updateCategory({ id: editing.id, name: editName.trim(), type: editType });
        toast.success("Категория сохранена");
        setEditing(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось сохранить категорию");
      }
    });
  };

  const onDelete = (c: Category) => {
    startTransition(async () => {
      try {
        await deleteCategory(c.id);
        toast.success(`Категория «${c.name}» удалена`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось удалить категорию");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Категории</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground">Категорий пока нет.</p>
          )}
          {categories.map((c) => (
            <Badge key={c.id} variant="outline" className="h-auto gap-1.5 py-1">
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
                onClick={() => onDelete(c)}
                className="text-muted-foreground transition-colors hover:text-danger"
                aria-label={`Удалить категорию ${c.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={type} onValueChange={(v) => setType(v as "EXPENSE" | "INCOME")}>
            <SelectTrigger className="w-full sm:w-32">
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
            className="w-full sm:flex-1"
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
      </CardContent>
    </Card>
  );
}
