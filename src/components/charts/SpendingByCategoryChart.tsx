"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
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
    <Card>
      <CardHeader>
        <CardTitle>Расходы по категориям</CardTitle>
      </CardHeader>
      <CardContent>
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
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={entry.name === "Остальное" ? "var(--muted-foreground)" : COLORS[index % COLORS.length]}
                    fillOpacity={entry.name === "Остальное" ? 0.4 : 1}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => Number(value ?? 0).toLocaleString("ru-RU", { maximumFractionDigits: 0 })}
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
      </CardContent>
    </Card>
  );
}
