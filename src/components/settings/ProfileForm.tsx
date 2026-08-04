"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProfile } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function ProfileForm({ name }: { name: string | null }) {
  const [value, setValue] = useState(name ?? "");
  const [isPending, startTransition] = useTransition();

  const onSave = () => {
    if (!value.trim()) return;
    startTransition(async () => {
      try {
        await updateProfile({ name: value.trim() });
        toast.success("Имя сохранено");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось сохранить имя");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Профиль</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex w-full flex-col gap-1.5 sm:max-w-xs">
            <Label htmlFor="profile-name">Имя</Label>
            <Input id="profile-name" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <Button
            type="button"
            disabled={isPending || !value.trim()}
            onClick={onSave}
            className="w-full sm:w-auto"
          >
            {isPending ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
