"use client";

import { useState, useTransition } from "react";
import Papa from "papaparse";
import { importCsvStatement } from "@/lib/actions/import";

export function CsvImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [dateCol, setDateCol] = useState("");
  const [descCol, setDescCol] = useState("");
  const [amountCol, setAmountCol] = useState("");
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
      });
      setResult(
        `Импортировано: ${res.imported}, дубликатов пропущено: ${res.skippedDuplicates}, невалидных: ${res.skippedInvalid} (всего строк: ${res.totalRows})`,
      );
    });
  };

  const selectClass =
    "rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

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
          <label className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Дата</span>
            <select
              value={dateCol}
              onChange={(e) => setDateCol(e.target.value)}
              className={selectClass}
            >
              <option value="">—</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Описание</span>
            <select
              value={descCol}
              onChange={(e) => setDescCol(e.target.value)}
              className={selectClass}
            >
              <option value="">—</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Сумма</span>
            <select
              value={amountCol}
              onChange={(e) => setAmountCol(e.target.value)}
              className={selectClass}
            >
              <option value="">—</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <button
        type="button"
        disabled={!file || !dateCol || !descCol || !amountCol || isPending}
        onClick={onImport}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {isPending ? "Импорт..." : "Импортировать"}
      </button>

      {result && (
        <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          {result}
        </p>
      )}
    </div>
  );
}
