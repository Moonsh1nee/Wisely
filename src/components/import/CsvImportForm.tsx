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

  return (
    <div className="rounded border p-4">
      <h2 className="mb-3 font-medium">Импорт выписки (CSV)</h2>

      <input
        type="file"
        accept=".csv"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        className="mb-3 text-sm"
      />

      {headers.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2 text-sm">
          <label className="flex items-center gap-1">
            Дата:
            <select
              value={dateCol}
              onChange={(e) => setDateCol(e.target.value)}
              className="rounded border px-2 py-1"
            >
              <option value="">—</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1">
            Описание:
            <select
              value={descCol}
              onChange={(e) => setDescCol(e.target.value)}
              className="rounded border px-2 py-1"
            >
              <option value="">—</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1">
            Сумма:
            <select
              value={amountCol}
              onChange={(e) => setAmountCol(e.target.value)}
              className="rounded border px-2 py-1"
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
        className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
      >
        {isPending ? "Импорт..." : "Импортировать"}
      </button>

      {result && <p className="mt-2 text-sm text-gray-600">{result}</p>}
    </div>
  );
}
