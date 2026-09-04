"use client";

import { Button } from "@/components/ui/button";
import type { Routine } from "@/server/queries/routines";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function describeRepeat(routine: Routine): string {
  switch (routine.repeatType) {
    case "daily":
      return "매일";
    case "weekday": {
      const weekdays = "weekdays" in routine.repeatConfig ? routine.repeatConfig.weekdays : [];
      return weekdays.map((d) => WEEKDAY_LABELS[d]).join(", ") || "요일 미지정";
    }
    case "weekly_n": {
      const times = "times_per_week" in routine.repeatConfig ? routine.repeatConfig.times_per_week : 0;
      return `주 ${times}회`;
    }
    case "every_other_day":
      return "격일";
  }
}

export function RoutineCard({
  routine,
  onEdit,
  onToggleArchive,
}: {
  routine: Routine;
  onEdit: (routine: Routine) => void;
  onToggleArchive: (routine: Routine) => void;
}) {
  return (
    <li className="border-border bg-card flex items-center gap-3 rounded-lg border px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-base">{routine.name}</p>
        <p className="text-muted-foreground text-sm">{describeRepeat(routine)}</p>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(routine)}>
        수정
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => onToggleArchive(routine)}>
        {routine.isArchived ? "보관 해제" : "보관"}
      </Button>
    </li>
  );
}
