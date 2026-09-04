"use client";

import { Flame } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { RoutineTodayItem } from "@/server/queries/today";

// 루틴은 오늘 화면에서 체크만 가능하다 — 이름 변경/반복주기 수정은 /routines
// 에서만 한다(템플릿 편집이라 오늘 화면의 즉석 수정과 성격이 다르다).
export function RoutineRow({
  routine,
  onToggle,
}: {
  routine: RoutineTodayItem;
  onToggle: (id: string, completed: boolean) => void;
}) {
  return (
    <li
      className={cn(
        "border-border bg-card flex items-center gap-2 rounded-lg border px-3 py-2.5 transition-colors duration-200",
        routine.completed && "border-transparent bg-transparent",
      )}
    >
      <span className="size-4 shrink-0" aria-hidden />
      <Checkbox
        checked={routine.completed}
        onCheckedChange={(checked) => onToggle(routine.id, checked)}
        aria-label={
          routine.completed ? `"${routine.title}" 완료 취소` : `"${routine.title}" 완료로 표시`
        }
      />
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-base",
          routine.completed && "text-muted-foreground line-through",
        )}
      >
        {routine.title}
      </span>
      {routine.streak > 0 && (
        <span className="text-muted-foreground flex shrink-0 items-center gap-0.5 text-xs tabular-nums">
          <Flame className="size-3.5" />
          {routine.streak}
        </span>
      )}
    </li>
  );
}
