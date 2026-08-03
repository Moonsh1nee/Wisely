"use client";

import { useState, useTransition } from "react";
import { updateDefaultCurrency } from "@/lib/actions/settings";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CurrencySettings({ defaultCurrency }: { defaultCurrency: string }) {
  const [currency, setCurrency] = useState(defaultCurrency);
  const [isPending, startTransition] = useTransition();

  const onChange = (value: string) => {
    setCurrency(value);
    startTransition(() => updateDefaultCurrency({ currency: value }));
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Валюта по умолчанию</span>
      <Select value={currency} onValueChange={onChange} disabled={isPending}>
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_CURRENCIES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
