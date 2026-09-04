"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type MagicLinkState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "sent"; email: string };

async function getSiteOrigin(): Promise<string> {
  const headerList = await headers();
  return (
    headerList.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  );
}

export async function signInWithMagicLink(
  _prevState: MagicLinkState,
  formData: FormData,
): Promise<MagicLinkState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { status: "error", message: "이메일을 입력해 주세요." };
  }

  const supabase = await createClient();
  const origin = await getSiteOrigin();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("[signInWithMagicLink]", error.status, error.code, error.message);
    return {
      status: "error",
      message: "로그인 링크를 보내지 못했어요. 잠시 후 다시 시도해 주세요.",
    };
  }

  return { status: "sent", email };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
