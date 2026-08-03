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
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

interface SpendingSlice {
  name: string;
  total: number;
}

export function SpendingByCategoryChart({ data }: { data: SpendingSlice[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Нет данных о расходах
        </p>
        <p className="text-xs text-muted-foreground">
          Добавьте расходы, чтобы увидеть распределение по категориям.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold">Расходы по категориям</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              label={(entry) => `${Number(entry.value ?? 0).toFixed(0)}`}
              labelLine={false}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 13,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
