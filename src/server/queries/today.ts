import { getCurrentLocalDateString } from "@/lib/date/local-date";
import { getCurrentProfile } from "./profile";
import { requireUser } from "@/server/require-user";

export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  sortOrder: number;
};

export async function getTodayTodos(): Promise<{ today: string; todos: Todo[] }> {
  const { supabase, user } = await requireUser();
  const profile = await getCurrentProfile(user.id);
  const today = getCurrentLocalDateString(profile.timezone, profile.dayStartHour);

  const { data, error } = await supabase
    .from("todos")
    .select("id, title, completed, sort_order")
    .eq("todo_date", today)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return {
    today,
    todos: (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      completed: row.completed,
      sortOrder: row.sort_order,
    })),
  };
}
