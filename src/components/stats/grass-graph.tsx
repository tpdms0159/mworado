"use client";

import { useState } from "react";
import { getWeekday } from "@/lib/date/local-date";
import { cn } from "@/lib/utils";
import type { GrassDay } from "@/server/queries/stats";

const LEVEL_CLASSES: Record<GrassDay["level"], string> = {
  0: "bg-muted",
  1: "bg-primary/25",
  2: "bg-primary/50",
  3: "bg-primary/75",
  4: "bg-primary",
};

function buildColumns(days: GrassDay[]): (GrassDay | null)[][] {
  if (days.length === 0) return [];

  const leadingPad = getWeekday(days[0].date); // 0=일요일부터 시작하도록 앞쪽을 채운다
  const cells: (GrassDay | null)[] = [...Array(leadingPad).fill(null), ...days];
  const trailingPad = (7 - (cells.length % 7)) % 7;
  const padded = [...cells, ...Array(trailingPad).fill(null)];

  const columns: (GrassDay | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    columns.push(padded.slice(i, i + 7));
  }
  return columns;
}

function formatDayDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}

export function GrassGraph({ days }: { days: GrassDay[] }) {
  const [selected, setSelected] = useState<GrassDay | null>(null);
  const columns = buildColumns(days);
  const shown = selected ?? days[days.length - 1] ?? null;

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto pb-1">
        <div className="flex w-max gap-[3px]">
          {columns.map((column, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-[3px]">
              {column.map((day, rowIndex) =>
                day ? (
                  <button
                    key={day.date}
                    type="button"
                    onMouseEnter={() => setSelected(day)}
                    onFocus={() => setSelected(day)}
                    onClick={() => setSelected(day)}
                    aria-label={`${formatDayDate(day.date)}: ${
                      day.planned === 0 ? "기록 없음" : `${day.completed}/${day.planned} 완료`
                    }`}
                    className={cn(
                      "size-3 rounded-[3px] transition-colors",
                      LEVEL_CLASSES[day.level],
                    )}
                  />
                ) : (
                  <div key={rowIndex} className="size-3" aria-hidden />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
      <p className="text-muted-foreground text-sm" aria-live="polite">
        {shown
          ? `${formatDayDate(shown.date)} — ${
              shown.planned === 0 ? "기록 없음" : `${shown.completed}/${shown.planned} 완료`
            }`
          : "아직 기록이 없어요"}
      </p>
    </div>
  );
}
