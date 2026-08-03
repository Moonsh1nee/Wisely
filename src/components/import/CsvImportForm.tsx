"use client";

import { useState, useTransition } from "react";
import Papa from "papaparse";
import { importCsvStatement } from "@/lib/actions/import";
import { Button } from "@/components/ui/button";
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
      const text = await file.text();
      const res = await importCsvStatement(text, {
        date: dateCol,
        description: descCol,
        amount: amountCol,
      }, accountId || null);
      setResult(
        `Импортировано: ${res.imported}, дубликатов пропущено: ${res.skippedDuplicates}, невалидных: ${res.skippedInvalid} (всего строк: ${res.totalRows})`,
      );
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold">Импорт выписки (CSV)</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Загрузите CSV-файл банковской выписки и сопоставьте колонки.
      </p>

      <label className="mb-3 flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
        <span>{file ? file.name : "Выбрать CSV-файл"}</span>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          className="hidden"
        />
      </label>

      {headers.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-3 text-sm">
          {accounts.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Счёт</span>
              <Select
                value={accountId || "none"}
                onValueChange={(v) => setAccountId(v === "none" ? "" : v)}
              >
                <SelectTrigger className="w-40">
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Дата</span>
            <Select value={dateCol || undefined} onValueChange={setDateCol}>
              <SelectTrigger className="w-40">
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Описание</span>
            <Select value={descCol || undefined} onValueChange={setDescCol}>
              <SelectTrigger className="w-40">
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Сумма</span>
            <Select value={amountCol || undefined} onValueChange={setAmountCol}>
              <SelectTrigger className="w-40">
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

      <Button type="button" disabled={!file || !dateCol || !descCol || !amountCol || isPending} onClick={onImport}>
        {isPending ? "Импорт..." : "Импортировать"}
      </Button>

      {result && (
        <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          {result}
        </p>
      )}
    </div>
  );
}
