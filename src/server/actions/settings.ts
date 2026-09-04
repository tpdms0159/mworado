"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/server/require-user";

export type ActionResult = { error?: string };

const GENERIC_ERROR = "네트워크에 문제가 있는 것 같아요. 잠시 후 다시 시도해 주세요.";

export async function updateDayStartHour(hour: number): Promise<ActionResult> {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    return { error: "0~23 사이 숫자로 입력해 주세요." };
  }

  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("profiles")
      .update({ day_start_hour: hour })
      .eq("id", user.id);

    if (error) throw error;

    revalidatePath("/today");
    revalidatePath("/settings");
    return {};
  } catch {
    return { error: GENERIC_ERROR };
  }
}

// 사용자의 모든 데이터를 JSON으로 내보낸다. 다운로드 트리거는 클라이언트에서 처리.
export async function exportUserData(): Promise<
  ActionResult & { data?: Record<string, unknown> }
> {
  try {
    const { supabase, user } = await requireUser();

    const [profileResult, todosResult, routinesResult, logsResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("todos").select("*").eq("user_id", user.id),
      supabase.from("routines").select("*").eq("user_id", user.id),
      supabase.from("routine_logs").select("*").eq("user_id", user.id),
    ]);

    if (todosResult.error) throw todosResult.error;
    if (routinesResult.error) throw routinesResult.error;
    if (logsResult.error) throw logsResult.error;

    return {
      data: {
        exported_at: new Date().toISOString(),
        email: user.email,
        profile: profileResult.data ?? null,
        todos: todosResult.data ?? [],
        routines: routinesResult.data ?? [],
        routine_logs: logsResult.data ?? [],
      },
    };
  } catch {
    return { error: GENERIC_ERROR };
  }
}

// 계정 삭제. auth.users 행을 지우면 profiles/routines/routine_logs/todos가
// 마이그레이션에 정의된 on delete cascade로 함께 삭제된다.
export async function deleteAccount(): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const admin = createAdminClient();

    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;

    await supabase.auth.signOut();
  } catch {
    return { error: GENERIC_ERROR };
  }

  redirect("/");
}
