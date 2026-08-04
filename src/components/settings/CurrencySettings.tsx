"use client";

import { useState, useTransition } from "react";
import { updateDefaultCurrency } from "@/lib/actions/settings";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle>Валюта по умолчанию</CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={currency} onValueChange={onChange} disabled={isPending}>
          <SelectTrigger className="w-32">
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
      </CardContent>
    </Card>
  );
}
