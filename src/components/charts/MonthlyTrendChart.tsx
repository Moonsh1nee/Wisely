"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MonthlyPoint {
  month: string;
  income: number;
  expense: number;
}

export function MonthlyTrendChart({ data }: { data: MonthlyPoint[] }) {
  if (data.length === 0) {
    return (
      <p className="flex h-64 items-center justify-center rounded border border-dashed text-sm text-gray-500">
        Пока недостаточно данных
      </p>
    );
  }

  return (
    <div className="h-64 rounded border p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="income" stroke="#10b981" name="Доход" />
          <Line type="monotone" dataKey="expense" stroke="#ef4444" name="Расход" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
