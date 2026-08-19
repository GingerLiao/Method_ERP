"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function TrendChart({
  data,
}: {
  data: { label: string; 銷售: number; 採購: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gSale" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gBuy" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <Tooltip
          formatter={(v: number) => "NT$ " + v.toLocaleString()}
          contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e2e8f0" }}
        />
        <Area type="monotone" dataKey="銷售" stroke="#4f46e5" fill="url(#gSale)" strokeWidth={2} />
        <Area type="monotone" dataKey="採購" stroke="#10b981" fill="url(#gBuy)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
