import {
  type LocalDateString,
  addDaysToDateString,
  getCurrentLocalDateString,
} from "@/lib/date/local-date";
import { type RepeatConfig, type RepeatType, isRoutineDueOn } from "@/lib/date/recurrence";
import { calcCurrentStreak } from "@/lib/date/streak";
import { requireUser } from "@/server/require-user";
import { getCurrentProfile } from "./profile";

export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  sortOrder: number;
};

export type RoutineTodayItem = {
  id: string;
  title: string;
  completed: boolean;
  streak: number;
};

// 스트릭 계산 시 과거 기록을 얼마나 거슬러 올라가 조회할지. 루틴 유형 중
// 가장 넓게 보는 weekly_n도 몇 주치면 충분하지만, 넉넉히 1년 조금 넘게 잡는다.
const STREAK_LOOKBACK_DAYS = 400;

export async function getTodayView(): Promise<{
  today: LocalDateString;
  todos: Todo[];
  routines: RoutineTodayItem[];
}> {
  const { supabase, user } = await requireUser();
  const profile = await getCurrentProfile(user.id);
  const today = getCurrentLocalDateString(profile.timezone, profile.dayStartHour);

  const [todosResult, routinesResult] = await Promise.all([
    supabase
      .from("todos")
      .select("id, title, completed, sort_order")
      .eq("todo_date", today)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
    supabase
      .from("routines")
      .select("id, name, repeat_type, repeat_config")
      .is("archived_at", null)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
  ]);

  if (todosResult.error) throw todosResult.error;
  if (routinesResult.error) throw routinesResult.error;

  const todos: Todo[] = (todosResult.data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    completed: row.completed,
    sortOrder: row.sort_order,
  }));

  const dueRoutines = (routinesResult.data ?? []).filter((r) =>
    isRoutineDueOn(r.repeat_type as RepeatType, r.repeat_config as RepeatConfig, today),
  );

  const routines: RoutineTodayItem[] = [];

  if (dueRoutines.length > 0) {
    const lookbackStart = addDaysToDateString(today, -STREAK_LOOKBACK_DAYS);
    const { data: logs, error: logsError } = await supabase
      .from("routine_logs")
      .select("routine_id, log_date")
      .in(
        "routine_id",
        dueRoutines.map((r) => r.id),
      )
      .eq("completed", true)
      .gte("log_date", lookbackStart)
      .lte("log_date", today);

    if (logsError) throw logsError;

    for (const routine of dueRoutines) {
      const completedDates = new Set(
        (logs ?? []).filter((l) => l.routine_id === routine.id).map((l) => l.log_date),
      );

      routines.push({
        id: routine.id,
        title: routine.name,
        completed: completedDates.has(today),
        streak: calcCurrentStreak(
          routine.repeat_type as RepeatType,
          routine.repeat_config as RepeatConfig,
          completedDates,
          today,
        ),
      });
    }
  }

  return { today, todos, routines };
}
