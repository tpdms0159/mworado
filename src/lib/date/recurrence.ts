import { type LocalDateString, diffInDays, getWeekday } from "./local-date";

export type RepeatType = "daily" | "weekday" | "weekly_n" | "every_other_day";

export type RepeatConfig =
  | { weekdays: number[] } // weekday: 0=일 ~ 6=토
  | { times_per_week: number } // weekly_n
  | { anchor_date: LocalDateString } // every_other_day
  | Record<string, never>; // daily: {}

/**
 * 루틴이 특정 날짜에 "오늘 목록에 뜨는 날"인지 판정한다.
 *
 * - daily: 항상 해당.
 * - weekday: 지정된 요일에만 해당.
 * - every_other_day: 루틴 생성일(anchor_date)로부터 이틀 간격.
 * - weekly_n: 특정 요일이 정해져 있지 않다 — 사용자가 그 주 아무 날에나
 *   원하는 만큼 체크하는 방식이라, 매일 목록에 뜬다. (며칠에 몇 번 했는지는
 *   스트릭 계산에서 주 단위로 집계한다. src/lib/date/streak.ts 참고)
 */
export function isRoutineDueOn(
  repeatType: RepeatType,
  repeatConfig: RepeatConfig,
  dateStr: LocalDateString,
): boolean {
  switch (repeatType) {
    case "daily":
      return true;
    case "weekday": {
      const weekdays = "weekdays" in repeatConfig ? repeatConfig.weekdays : [];
      return weekdays.includes(getWeekday(dateStr));
    }
    case "every_other_day": {
      if (!("anchor_date" in repeatConfig)) return false;
      const diff = diffInDays(dateStr, repeatConfig.anchor_date);
      return diff >= 0 && diff % 2 === 0;
    }
    case "weekly_n":
      return true;
  }
}
