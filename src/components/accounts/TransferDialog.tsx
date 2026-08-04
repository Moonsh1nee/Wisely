"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createTransfer } from "@/lib/actions/transfers";
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

interface Account {
  id: string;
  name: string;
  currency: string;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function TransferDialog({
  open,
  onOpenChange,
  accounts,
  defaultFromAccountId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  defaultFromAccountId?: string;
}) {
  const [fromAccountId, setFromAccountId] = useState(defaultFromAccountId ?? accounts[0]?.id ?? "");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  const toOptions = accounts.filter((a) => a.id !== fromAccountId);

  const onSubmit = () => {
    if (!fromAccountId || !toAccountId || !amount) return;
    startTransition(async () => {
      try {
        await createTransfer({
          fromAccountId,
          toAccountId,
          amount: Number(amount),
          description: description || undefined,
          date: new Date(date),
        });
        toast.success("Перевод выполнен");
        setAmount("");
        setDescription("");
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось выполнить перевод");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Перевод между счетами</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Откуда</Label>
            <Select value={fromAccountId} onValueChange={setFromAccountId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Куда</Label>
            <Select value={toAccountId} onValueChange={setToAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите счёт" />
              </SelectTrigger>
              <SelectContent>
                {toOptions.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Сумма</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Дата</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Описание</Label>
            <Input
              placeholder="Необязательно"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button
            type="button"
            disabled={isPending || !fromAccountId || !toAccountId || !amount}
            onClick={onSubmit}
          >
            {isPending ? "Перевод..." : "Перевести"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
