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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface MonthlyPoint {
  month: string;
  income: number;
  expense: number;
}

export function MonthlyTrendChart({ data }: { data: MonthlyPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Пока недостаточно данных
        </p>
        <p className="text-xs text-muted-foreground">
          График появится, когда накопится история за пару месяцев.
        </p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Динамика по месяцам</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" fontSize={12} stroke="var(--muted-foreground)" />
              <YAxis fontSize={12} stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 13,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="income"
                stroke="var(--success)"
                strokeWidth={2}
                dot={false}
                name="Доход"
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="var(--danger)"
                strokeWidth={2}
                dot={false}
                name="Расход"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
