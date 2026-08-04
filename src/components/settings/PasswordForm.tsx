"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { changePassword } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  const onSave = () => {
    if (!currentPassword || newPassword.length < 8) return;
    startTransition(async () => {
      try {
        await changePassword({ currentPassword, newPassword });
        toast.success("Пароль изменён");
        setCurrentPassword("");
        setNewPassword("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось изменить пароль");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Пароль</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:max-w-xs">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="current-password">Текущий пароль</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-password">Новый пароль</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            {newPassword.length > 0 && newPassword.length < 8 && (
              <p className="text-xs text-danger">Минимум 8 символов</p>
            )}
          </div>
          <Button
            type="button"
            disabled={isPending || !currentPassword || newPassword.length < 8}
            onClick={onSave}
          >
            {isPending ? "Сохранение..." : "Изменить пароль"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
