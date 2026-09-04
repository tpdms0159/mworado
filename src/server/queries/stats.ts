import {
  type LocalDateString,
  addDaysToDateString,
  getCurrentLocalDateString,
} from "@/lib/date/local-date";
import { type RepeatConfig, type RepeatType, isRoutineDueOn } from "@/lib/date/recurrence";
import { calcCurrentStreak } from "@/lib/date/streak";
import { requireUser } from "@/server/require-user";
import { getCurrentProfile } from "./profile";

// 잔디 그래프가 보여주는 기간(최근 1년). 최장 연속일도 이 범위 안에서만 계산한다.
export const GRASS_DAYS = 365;
// 루틴별 달성률을 계산하는 기간.
const ROUTINE_STATS_DAYS = 30;

export type GrassDay = {
  date: LocalDateString;
  planned: number;
  completed: number;
  // 0 = 그날 계획된 게 없었거나 아무것도 못 함(부담 주지 않기 위해 둘을 구분하지 않는다).
  // 1~4 = 완료율 구간(포인트 컬러의 명도 4단계).
  level: 0 | 1 | 2 | 3 | 4;
};

export type RoutineCompletionStat = {
  id: string;
  name: string;
  isArchived: boolean;
  planned: number;
  completed: number;
  rate: number;
};

export type StatsView = {
  today: LocalDateString;
  grassDays: GrassDay[];
  currentStreak: number;
  longestStreak: number;
  last30DaysRate: number;
  routineStats: RoutineCompletionStat[];
  hasAnyData: boolean;
};

function calcLevel(planned: number, completed: number): GrassDay["level"] {
  if (planned === 0 || completed === 0) return 0;
  const ratio = completed / planned;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

function calcLongestStreak(days: GrassDay[]): number {
  let longest = 0;
  let current = 0;
  for (const day of days) {
    if (day.completed > 0) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}

export async function getStatsView(): Promise<StatsView> {
  const { supabase, user } = await requireUser();
  const profile = await getCurrentProfile(user.id);
  const today = getCurrentLocalDateString(profile.timezone, profile.dayStartHour);
  const rangeStart = addDaysToDateString(today, -(GRASS_DAYS - 1));

  const [routinesResult, logsResult, todosResult] = await Promise.all([
    supabase
      .from("routines")
      .select("id, name, repeat_type, repeat_config, archived_at, created_at")
      .is("deleted_at", null),
    supabase
      .from("routine_logs")
      .select("routine_id, log_date, completed")
      .gte("log_date", rangeStart)
      .lte("log_date", today),
    supabase
      .from("todos")
      .select("todo_date, completed")
      .is("deleted_at", null)
      .gte("todo_date", rangeStart)
      .lte("todo_date", today),
  ]);

  if (routinesResult.error) throw routinesResult.error;
  if (logsResult.error) throw logsResult.error;
  if (todosResult.error) throw todosResult.error;

  const routines = routinesResult.data ?? [];
  const logs = logsResult.data ?? [];
  const todos = todosResult.data ?? [];

  const todosByDate = new Map<string, { planned: number; completed: number }>();
  for (const t of todos) {
    const entry = todosByDate.get(t.todo_date) ?? { planned: 0, completed: 0 };
    entry.planned += 1;
    if (t.completed) entry.completed += 1;
    todosByDate.set(t.todo_date, entry);
  }

  const completedDatesByRoutine = new Map<string, Set<string>>();
  for (const log of logs) {
    if (!log.completed) continue;
    const set = completedDatesByRoutine.get(log.routine_id) ?? new Set<string>();
    set.add(log.log_date);
    completedDatesByRoutine.set(log.routine_id, set);
  }

  const dates: string[] = [];
  for (let i = 0; i < GRASS_DAYS; i++) {
    dates.push(addDaysToDateString(rangeStart, i));
  }

  const grassDays: GrassDay[] = dates.map((date) => {
    const todoEntry = todosByDate.get(date) ?? { planned: 0, completed: 0 };
    let routinesPlanned = 0;
    let routinesCompleted = 0;

    for (const routine of routines) {
      // 루틴이 생기기 전 날짜는 "그날 계획됨"으로 치지 않는다(created_at 이전).
      if (routine.created_at.slice(0, 10) > date) continue;
      if (!isRoutineDueOn(routine.repeat_type as RepeatType, routine.repeat_config as RepeatConfig, date)) {
        continue;
      }
      routinesPlanned += 1;
      if (completedDatesByRoutine.get(routine.id)?.has(date)) routinesCompleted += 1;
    }

    const planned = todoEntry.planned + routinesPlanned;
    const completed = todoEntry.completed + routinesCompleted;

    return { date, planned, completed, level: calcLevel(planned, completed) };
  });

  const overallCompletedDates = new Set(
    grassDays.filter((d) => d.completed > 0).map((d) => d.date),
  );
  const currentStreak = calcCurrentStreak("daily", {}, overallCompletedDates, today);
  const longestStreak = calcLongestStreak(grassDays);

  const last30 = grassDays.slice(-ROUTINE_STATS_DAYS);
  const last30Planned = last30.reduce((sum, d) => sum + d.planned, 0);
  const last30Completed = last30.reduce((sum, d) => sum + d.completed, 0);
  const last30DaysRate = last30Planned === 0 ? 0 : last30Completed / last30Planned;

  const last30Dates = dates.slice(-ROUTINE_STATS_DAYS);
  const routineStats: RoutineCompletionStat[] = routines.map((routine) => {
    const createdDate = routine.created_at.slice(0, 10);
    const completedSet = completedDatesByRoutine.get(routine.id) ?? new Set<string>();
    let planned = 0;
    let completed = 0;

    for (const date of last30Dates) {
      if (createdDate > date) continue;
      if (!isRoutineDueOn(routine.repeat_type as RepeatType, routine.repeat_config as RepeatConfig, date)) {
        continue;
      }
      planned += 1;
      if (completedSet.has(date)) completed += 1;
    }

    return {
      id: routine.id,
      name: routine.name,
      isArchived: routine.archived_at !== null,
      planned,
      completed,
      rate: planned === 0 ? 0 : completed / planned,
    };
  });

  const hasAnyData = grassDays.some((d) => d.planned > 0);

  return { today, grassDays, currentStreak, longestStreak, last30DaysRate, routineStats, hasAnyData };
}
