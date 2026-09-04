"use server";

import { revalidatePath } from "next/cache";
import { getCurrentLocalDateString } from "@/lib/date/local-date";
import type { RepeatConfig, RepeatType } from "@/lib/date/recurrence";
import { getCurrentProfile } from "@/server/queries/profile";
import { requireUser } from "@/server/require-user";

export type ActionResult = { error?: string };

const GENERIC_ERROR = "네트워크에 문제가 있는 것 같아요. 잠시 후 다시 시도해 주세요.";

function revalidateRoutineViews() {
  revalidatePath("/today");
  revalidatePath("/routines");
  revalidatePath("/stats");
}

// every_other_day인데 anchor_date가 없으면(신규 생성, 또는 다른 유형에서
// 방금 전환된 경우) 오늘 날짜를 기준점으로 채운다. 이미 anchor_date가 있으면
// 그대로 유지해 과거 스트릭 계산 기준이 흔들리지 않게 한다.
async function resolveRepeatConfig(
  repeatType: RepeatType,
  repeatConfig: RepeatConfig,
  userId: string,
): Promise<RepeatConfig> {
  if (repeatType !== "every_other_day" || "anchor_date" in repeatConfig) {
    return repeatConfig;
  }
  const profile = await getCurrentProfile(userId);
  const today = getCurrentLocalDateString(profile.timezone, profile.dayStartHour);
  return { anchor_date: today };
}

export async function createRoutine(
  name: string,
  repeatType: RepeatType,
  repeatConfig: RepeatConfig,
): Promise<ActionResult & { id?: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "루틴 이름을 입력해 주세요." };

  try {
    const { supabase, user } = await requireUser();

    const { data: last } = await supabase
      .from("routines")
      .select("sort_order")
      .is("deleted_at", null)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSortOrder = (last?.sort_order ?? -1) + 1;
    const finalConfig = await resolveRepeatConfig(repeatType, repeatConfig, user.id);

    const { data, error } = await supabase
      .from("routines")
      .insert({
        user_id: user.id,
        name: trimmed,
        repeat_type: repeatType,
        repeat_config: finalConfig,
        sort_order: nextSortOrder,
      })
      .select("id")
      .single();

    if (error) throw error;

    revalidateRoutineViews();
    return { id: data.id };
  } catch {
    return { error: GENERIC_ERROR };
  }
}

export async function updateRoutine(
  id: string,
  name: string,
  repeatType: RepeatType,
  repeatConfig: RepeatConfig,
): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "루틴 이름을 입력해 주세요." };

  try {
    const { supabase, user } = await requireUser();
    const finalConfig = await resolveRepeatConfig(repeatType, repeatConfig, user.id);
    const { error } = await supabase
      .from("routines")
      .update({ name: trimmed, repeat_type: repeatType, repeat_config: finalConfig })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    revalidateRoutineViews();
    return {};
  } catch {
    return { error: GENERIC_ERROR };
  }
}

export async function setRoutineArchived(id: string, archived: boolean): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("routines")
      .update({ archived_at: archived ? new Date().toISOString() : null })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    revalidateRoutineViews();
    return {};
  } catch {
    return { error: GENERIC_ERROR };
  }
}

// 루틴의 "그날 기록"을 생성/수정한다. 템플릿(routines)과 분리되어 있어
// 이 호출은 routine_logs 한 행만 건드리고, 과거 다른 날짜 기록에는 영향이 없다.
export async function toggleRoutineLog(routineId: string, completed: boolean): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const profile = await getCurrentProfile(user.id);
    const today = getCurrentLocalDateString(profile.timezone, profile.dayStartHour);

    const { error } = await supabase.from("routine_logs").upsert(
      {
        routine_id: routineId,
        user_id: user.id,
        log_date: today,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      },
      { onConflict: "routine_id,log_date" },
    );

    if (error) throw error;

    revalidateRoutineViews();
    return {};
  } catch {
    return { error: GENERIC_ERROR };
  }
}
