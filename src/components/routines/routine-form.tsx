"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { RepeatConfig, RepeatType } from "@/lib/date/recurrence";
import type { Routine } from "@/server/queries/routines";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const REPEAT_TYPE_OPTIONS: { value: RepeatType; label: string }[] = [
  { value: "daily", label: "매일" },
  { value: "weekday", label: "특정 요일" },
  { value: "weekly_n", label: "주 N회" },
  { value: "every_other_day", label: "격일" },
];

function getInitialWeekdays(routine?: Routine): number[] {
  if (routine?.repeatType === "weekday" && "weekdays" in routine.repeatConfig) {
    return routine.repeatConfig.weekdays;
  }
  return [];
}

function getInitialTimesPerWeek(routine?: Routine): number {
  if (routine?.repeatType === "weekly_n" && "times_per_week" in routine.repeatConfig) {
    return routine.repeatConfig.times_per_week;
  }
  return 3;
}

export function RoutineForm({
  routine,
  onSubmit,
  onCancel,
  submitting,
}: {
  routine?: Routine;
  onSubmit: (name: string, repeatType: RepeatType, repeatConfig: RepeatConfig) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [name, setName] = useState(routine?.name ?? "");
  const [repeatType, setRepeatType] = useState<RepeatType>(routine?.repeatType ?? "daily");
  const [weekdays, setWeekdays] = useState<number[]>(getInitialWeekdays(routine));
  const [timesPerWeek, setTimesPerWeek] = useState(getInitialTimesPerWeek(routine));
  const [error, setError] = useState<string | null>(null);

  function toggleWeekday(day: number) {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("루틴 이름을 입력해 주세요.");
      return;
    }
    if (repeatType === "weekday" && weekdays.length === 0) {
      setError("요일을 하나 이상 선택해 주세요.");
      return;
    }
    setError(null);

    let repeatConfig: RepeatConfig;
    if (repeatType === "weekday") {
      repeatConfig = { weekdays };
    } else if (repeatType === "weekly_n") {
      repeatConfig = { times_per_week: timesPerWeek };
    } else if (repeatType === "every_other_day") {
      // 기존에 격일 루틴이었다면 anchor_date를 유지, 아니면 서버에서 오늘 날짜로 채운다.
      repeatConfig =
        routine?.repeatType === "every_other_day" ? routine.repeatConfig : ({} as RepeatConfig);
    } else {
      repeatConfig = {};
    }

    onSubmit(trimmed, repeatType, repeatConfig);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="routine-name">루틴 이름</Label>
        <Input
          id="routine-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 물 2L 마시기"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label>반복 주기</Label>
        <div className="flex flex-wrap gap-1.5">
          {REPEAT_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRepeatType(option.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                repeatType === option.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input text-foreground hover:bg-muted",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {repeatType === "weekday" && (
        <div className="space-y-2">
          <Label>요일 선택</Label>
          <div className="flex gap-1">
            {WEEKDAY_LABELS.map((label, day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleWeekday(day)}
                aria-pressed={weekdays.includes(day)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border text-sm transition-colors",
                  weekdays.includes(day)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input text-foreground hover:bg-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {repeatType === "weekly_n" && (
        <div className="space-y-2">
          <Label htmlFor="times-per-week">주 몇 회</Label>
          <Input
            id="times-per-week"
            type="number"
            min={1}
            max={7}
            value={timesPerWeek}
            onChange={(e) => setTimesPerWeek(Math.min(7, Math.max(1, Number(e.target.value) || 1)))}
            className="w-24"
          />
        </div>
      )}

      {repeatType === "every_other_day" && (
        <p className="text-muted-foreground text-sm">
          {routine?.repeatType === "every_other_day"
            ? "기존 격일 주기를 그대로 유지해요."
            : "오늘부터 이틀 간격으로 시작해요."}
        </p>
      )}

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "저장 중..." : routine ? "수정 완료" : "루틴 추가"}
        </Button>
      </div>
    </form>
  );
}
