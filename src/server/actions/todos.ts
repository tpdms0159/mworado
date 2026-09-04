"use server";

import { revalidatePath } from "next/cache";
import { getCurrentLocalDateString } from "@/lib/date/local-date";
import { getCurrentProfile } from "@/server/queries/profile";
import { requireUser } from "@/server/require-user";

export type ActionResult = { error?: string };

const GENERIC_ERROR = "네트워크에 문제가 있는 것 같아요. 잠시 후 다시 시도해 주세요.";

export async function createTodo(title: string): Promise<ActionResult & { id?: string }> {
  const trimmed = title.trim();
  if (!trimmed) return { error: "할 일을 입력해 주세요." };

  try {
    const { supabase, user } = await requireUser();
    const profile = await getCurrentProfile(user.id);
    const today = getCurrentLocalDateString(profile.timezone, profile.dayStartHour);

    const { data: last } = await supabase
      .from("todos")
      .select("sort_order")
      .eq("todo_date", today)
      .is("deleted_at", null)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSortOrder = (last?.sort_order ?? -1) + 1;

    const { data, error } = await supabase
      .from("todos")
      .insert({
        user_id: user.id,
        title: trimmed,
        todo_date: today,
        sort_order: nextSortOrder,
      })
      .select("id")
      .single();

    if (error) throw error;

    revalidatePath("/today");
    return { id: data.id };
  } catch {
    return { error: GENERIC_ERROR };
  }
}

export async function toggleTodo(id: string, completed: boolean): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("todos")
      .update({ completed, completed_at: completed ? new Date().toISOString() : null })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/today");
    return {};
  } catch {
    return { error: GENERIC_ERROR };
  }
}

export async function updateTodoTitle(id: string, title: string): Promise<ActionResult> {
  const trimmed = title.trim();
  if (!trimmed) return { error: "할 일을 입력해 주세요." };

  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("todos")
      .update({ title: trimmed })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/today");
    return {};
  } catch {
    return { error: GENERIC_ERROR };
  }
}

export async function deleteTodo(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("todos")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/today");
    return {};
  } catch {
    return { error: GENERIC_ERROR };
  }
}

export async function restoreTodo(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("todos")
      .update({ deleted_at: null })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/today");
    return {};
  } catch {
    return { error: GENERIC_ERROR };
  }
}

export async function reorderTodos(orderedIds: string[]): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();

    await Promise.all(
      orderedIds.map((id, index) =>
        supabase
          .from("todos")
          .update({ sort_order: index })
          .eq("id", id)
          .eq("user_id", user.id),
      ),
    );

    revalidatePath("/today");
    return {};
  } catch {
    return { error: GENERIC_ERROR };
  }
}
