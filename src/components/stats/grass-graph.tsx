"use client";

import { useState } from "react";
import { Check, Circle, X } from "lucide-react";
import { getWeekday } from "@/lib/date/local-date";
import { cn } from "@/lib/utils";
import type { DayDetail, GrassDay } from "@/server/queries/stats";

const LEVEL_CLASSES: Record<GrassDay["level"], string> = {
  0: "bg-muted",
  1: "bg-primary/25",
  2: "bg-primary/50",
  3: "bg-primary/75",
  4: "bg-primary",
};

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

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

function DetailRow({ title, completed }: { title: string; completed: boolean }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {completed ? (
        <Check className="text-primary size-3.5 shrink-0" aria-hidden />
      ) : (
        <Circle className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
      )}
      <span className={cn("min-w-0 truncate", completed && "text-muted-foreground line-through")}>
        {title}
      </span>
    </li>
  );
}

export function GrassGraph({
  days,
  dayDetails,
}: {
  days: GrassDay[];
  dayDetails?: Record<string, DayDetail>;
}) {
  const [selected, setSelected] = useState<GrassDay | null>(null);
  const [detailDate, setDetailDate] = useState<string | null>(null);
  const columns = buildColumns(days);
  const shown = selected ?? days[days.length - 1] ?? null;

  const detail = detailDate ? dayDetails?.[detailDate] : undefined;
  const detailIsEmpty =
    !detail || (detail.todos.length === 0 && detail.routines.length === 0);

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
                    onClick={() => {
                      setSelected(day);
                      setDetailDate((prev) => (prev === day.date ? null : day.date));
                    }}
                    aria-label={`${formatDayDate(day.date)}: ${
                      day.planned === 0 ? "기록 없음" : `${day.completed}/${day.planned} 완료`
                    }`}
                    className={cn(
                      "size-3 rounded-[3px] transition-colors",
                      LEVEL_CLASSES[day.level],
                      detailDate === day.date && "ring-foreground ring-1 ring-offset-1",
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

      {detailDate && (
        <div className="border-border flex flex-col gap-2 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">
              {formatDayDate(detailDate)} ({WEEKDAY_LABELS[getWeekday(detailDate)]})
            </span>
            <button
              type="button"
              onClick={() => setDetailDate(null)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="닫기"
            >
              <X className="size-4" />
            </button>
          </div>

          {detailIsEmpty ? (
            <p className="text-muted-foreground text-sm">이 날 등록된 항목이 없어요.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {detail!.routines.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-muted-foreground text-xs">루틴</p>
                  <ul className="flex flex-col gap-1">
                    {detail!.routines.map((item, i) => (
                      <DetailRow key={`r-${i}`} title={item.title} completed={item.completed} />
                    ))}
                  </ul>
                </div>
              )}
              {detail!.todos.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-muted-foreground text-xs">할 일</p>
                  <ul className="flex flex-col gap-1">
                    {detail!.todos.map((item, i) => (
                      <DetailRow key={`t-${i}`} title={item.title} completed={item.completed} />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
