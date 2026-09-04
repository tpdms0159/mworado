import type { RepeatConfig, RepeatType } from "@/lib/date/recurrence";
import { requireUser } from "@/server/require-user";

export type Routine = {
  id: string;
  name: string;
  repeatType: RepeatType;
  repeatConfig: RepeatConfig;
  sortOrder: number;
  isArchived: boolean;
};

export async function getRoutines(): Promise<Routine[]> {
  const { supabase } = await requireUser();

  const { data, error } = await supabase
    .from("routines")
    .select("id, name, repeat_type, repeat_config, sort_order, archived_at")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    repeatType: row.repeat_type as RepeatType,
    repeatConfig: row.repeat_config as RepeatConfig,
    sortOrder: row.sort_order,
    isArchived: row.archived_at !== null,
  }));
}
