"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface BalancePoint {
  month: string;
  balance: number;
}

export function BalanceTrendChart({ data, currency }: { data: BalancePoint[]; currency: string }) {
  if (data.length === 0) return null;

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" fontSize={12} stroke="var(--muted-foreground)" />
          <YAxis fontSize={12} stroke="var(--muted-foreground)" width={48} />
          <Tooltip
            formatter={(value) => Number(value ?? 0).toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " " + currency}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 13,
            }}
          />
          <Area type="monotone" dataKey="balance" stroke="var(--chart-1)" strokeWidth={2} fill="url(#balanceFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
