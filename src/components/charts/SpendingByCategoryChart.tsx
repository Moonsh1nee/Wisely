"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = [
  "#111827",
  "#4b5563",
  "#9ca3af",
  "#f59e0b",
  "#ef4444",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
];

interface SpendingSlice {
  name: string;
  total: number;
}

export function SpendingByCategoryChart({ data }: { data: SpendingSlice[] }) {
  if (data.length === 0) {
    return (
      <p className="flex h-64 items-center justify-center rounded border border-dashed text-sm text-gray-500">
        Нет данных о расходах за период
      </p>
    );
  }

  return (
    <div className="h-64 rounded border p-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={(entry) => `${entry.name}: ${Number(entry.value ?? 0).toFixed(0)}`}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
