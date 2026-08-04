"use client";

import { useState, useTransition } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { importCsvStatement } from "@/lib/actions/import";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
}

export function CsvImportForm({ accounts = [] }: { accounts?: Account[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [dateCol, setDateCol] = useState("");
  const [descCol, setDescCol] = useState("");
  const [amountCol, setAmountCol] = useState("");
  const [accountId, setAccountId] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onFileChange = (f: File | null) => {
    setFile(f);
    setResult(null);
    if (!f) {
      setHeaders([]);
      return;
    }
    f.text().then((text) => {
      const parsed = Papa.parse(text, { header: true, preview: 1 });
      setHeaders(parsed.meta.fields ?? []);
    });
  };

  const onImport = () => {
    if (!file || !dateCol || !descCol || !amountCol) return;
    startTransition(async () => {
      try {
        const text = await file.text();
        const res = await importCsvStatement(text, {
          date: dateCol,
          description: descCol,
          amount: amountCol,
        }, accountId || null);
        setResult(
          `Импортировано: ${res.imported}, дубликатов пропущено: ${res.skippedDuplicates}, невалидных: ${res.skippedInvalid} (всего строк: ${res.totalRows})`,
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось импортировать выписку");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Импорт выписки (CSV)</CardTitle>
        <CardDescription>
          Загрузите CSV-файл банковской выписки и сопоставьте колонки.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <label className="mb-3 flex w-full cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground sm:w-fit">
          <span>{file ? file.name : "Выбрать CSV-файл"}</span>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </label>

        {headers.length > 0 && (
          <div className="mb-4 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap">
            {accounts.length > 0 && (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                <span className="text-xs font-medium text-muted-foreground">Счёт</span>
                <Select
                  value={accountId || "none"}
                  onValueChange={(v) => setAccountId(v === "none" ? "" : v)}
                >
                  <SelectTrigger className="w-full sm:w-40">
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
              </div>
            )}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
              <span className="text-xs font-medium text-muted-foreground">Дата</span>
              <Select value={dateCol || undefined} onValueChange={setDateCol}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
              <span className="text-xs font-medium text-muted-foreground">Описание</span>
              <Select value={descCol || undefined} onValueChange={setDescCol}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
              <span className="text-xs font-medium text-muted-foreground">Сумма</span>
              <Select value={amountCol || undefined} onValueChange={setAmountCol}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <Button
          type="button"
          disabled={!file || !dateCol || !descCol || !amountCol || isPending}
          onClick={onImport}
          className="w-full sm:w-auto"
        >
          {isPending ? "Импорт..." : "Импортировать"}
        </Button>

        {result && (
          <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            {result}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
