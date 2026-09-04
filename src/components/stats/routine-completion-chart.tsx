"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RoutineCompletionStat } from "@/server/queries/stats";

export function RoutineCompletionChart({ stats }: { stats: RoutineCompletionStat[] }) {
  const data = stats.map((s) => ({
    name: s.isArchived ? `${s.name} (보관됨)` : s.name,
    percent: Math.round(s.rate * 100),
  }));

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid horizontal={false} strokeOpacity={0.15} />
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={12} />
          <YAxis type="category" dataKey="name" width={100} fontSize={12} tickLine={false} />
          <Tooltip formatter={(value) => [`${value}%`, "달성률"]} />
          <Bar dataKey="percent" fill="var(--primary)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
