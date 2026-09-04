import { type LocalDateString, addDaysToDateString, getWeekday } from "./local-date";
import { type RepeatConfig, type RepeatType, isRoutineDueOn } from "./recurrence";

// 무한루프 방지용 탐색 상한. 10년치를 넘어서까지 거슬러 올라갈 일은 없다.
const MAX_LOOKBACK_DAYS = 3650;
const MAX_LOOKBACK_WEEKS = 520;

/**
 * 스트릭(연속일) 계산 규칙 — README "스트릭 계산 규칙" 절과 동일한 내용.
 *
 * 공통 원칙:
 * - "오늘"은 아직 하루가 끝나지 않았으므로, 오늘 체크를 안 했다고 스트릭이
 *   끊기지는 않는다(끊김 판정은 하루가 지난 뒤부터). 다만 오늘 체크를 하면
 *   당연히 스트릭에 포함된다.
 * - 미래 날짜는 절대 스트릭 계산에 포함하지 않는다.
 *
 * - daily / weekday / every_other_day: "해당 날짜(required date)"만 대상으로
 *   오늘부터 거슬러 올라가며 연속 완료 횟수를 센다. 해당 날짜가 아닌 날은
 *   건너뛴다(스트릭에 영향 없음). 해당 날짜인데 완료 기록이 없으면 그 지점에서
 *   스트릭이 끊긴다.
 * - weekly_n: 특정 요일이 없으므로 "일" 단위가 아니라 "주"(월~일) 단위로 집계한다.
 *   그 주의 완료 횟수가 목표(N) 이상이면 그 주는 "성공". 연속 스트릭 = 연속으로
 *   성공한 주의 수. 진행 중인 이번 주는 아직 목표를 못 채웠어도 "실패"로 보지
 *   않고 계산에서 제외한다(주가 끝나야 성공/실패가 확정된다).
 */
export function calcCurrentStreak(
  repeatType: RepeatType,
  repeatConfig: RepeatConfig,
  completedDates: ReadonlySet<LocalDateString>,
  today: LocalDateString,
): number {
  if (repeatType === "weekly_n") {
    const timesPerWeek = "times_per_week" in repeatConfig ? repeatConfig.times_per_week : 0;
    return calcWeeklyStreak(timesPerWeek, completedDates, today);
  }

  return calcRequiredDateStreak(repeatType, repeatConfig, completedDates, today);
}

function calcRequiredDateStreak(
  repeatType: RepeatType,
  repeatConfig: RepeatConfig,
  completedDates: ReadonlySet<LocalDateString>,
  today: LocalDateString,
): number {
  let streak = 0;
  let cursor = today;

  // 오늘은 유예: 아직 안 했어도 끊기지 않고 그냥 건너뛴다.
  if (isRoutineDueOn(repeatType, repeatConfig, cursor) && !completedDates.has(cursor)) {
    cursor = addDaysToDateString(cursor, -1);
  }

  for (let i = 0; i < MAX_LOOKBACK_DAYS; i++) {
    if (isRoutineDueOn(repeatType, repeatConfig, cursor)) {
      if (completedDates.has(cursor)) {
        streak++;
      } else {
        break;
      }
    }
    cursor = addDaysToDateString(cursor, -1);
  }

  return streak;
}

function getWeekStart(dateStr: LocalDateString): LocalDateString {
  // 월요일 시작 기준 주. getWeekday는 0=일~6=토를 반환하므로
  // 월요일까지의 오프셋으로 변환한다.
  const offsetFromMonday = (getWeekday(dateStr) + 6) % 7;
  return addDaysToDateString(dateStr, -offsetFromMonday);
}

function countCompletionsInWeek(
  weekStart: LocalDateString,
  completedDates: ReadonlySet<LocalDateString>,
): number {
  let count = 0;
  for (let i = 0; i < 7; i++) {
    if (completedDates.has(addDaysToDateString(weekStart, i))) count++;
  }
  return count;
}

function calcWeeklyStreak(
  timesPerWeek: number,
  completedDates: ReadonlySet<LocalDateString>,
  today: LocalDateString,
): number {
  if (timesPerWeek <= 0) return 0;

  const currentWeekStart = getWeekStart(today);
  const completionsThisWeek = countCompletionsInWeek(currentWeekStart, completedDates);

  let streak = completionsThisWeek >= timesPerWeek ? 1 : 0;
  let cursorWeekStart = addDaysToDateString(currentWeekStart, -7);

  for (let i = 0; i < MAX_LOOKBACK_WEEKS; i++) {
    const completions = countCompletionsInWeek(cursorWeekStart, completedDates);
    if (completions >= timesPerWeek) {
      streak++;
      cursorWeekStart = addDaysToDateString(cursorWeekStart, -7);
    } else {
      break;
    }
  }

  return streak;
}
