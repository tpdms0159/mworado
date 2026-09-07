"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// 이메일 링크(가입/비밀번호 재설정) 발송 결과
export type EmailLinkState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "sent"; email: string };

// 이메일 + 비밀번호 로그인 결과 (성공 시엔 redirect되므로 상태가 남지 않음)
export type PasswordAuthState =
  | { status: "idle" }
  | { status: "error"; message: string };

const MIN_PASSWORD_LENGTH = 8;

// 링크 클릭 후 도착할 목적지. 여기서 비밀번호를 설정한다.
const SET_PASSWORD_PATH = "/account/set-password";

async function getSiteOrigin(): Promise<string> {
  const headerList = await headers();
  return (
    headerList.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  );
}

function readEmail(formData: FormData): string {
  return String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
}

// 가입: 이메일로 인증 링크를 보낸다. 링크를 누르면 세션이 생기고
// /account/set-password로 이동해 비밀번호를 정한다.
export async function sendSignUpLink(
  _prevState: EmailLinkState,
  formData: FormData,
): Promise<EmailLinkState> {
  const email = readEmail(formData);

  if (!email || !email.includes("@")) {
    return { status: "error", message: "올바른 이메일 주소를 입력해 주세요." };
  }

  const supabase = await createClient();
  const origin = await getSiteOrigin();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
        SET_PASSWORD_PATH,
      )}`,
    },
  });

  if (error) {
    console.error("[sendSignUpLink]", error.status, error.code, error.message);
    return {
      status: "error",
      message: "가입 메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.",
    };
  }

  return { status: "sent", email };
}

// 비밀번호 재설정: 이미 가입한 사용자에게만 링크가 간다.
// 존재하지 않는 이메일이어도 (계정 존재 여부 노출 방지를 위해) 성공으로 응답한다.
export async function sendPasswordResetLink(
  _prevState: EmailLinkState,
  formData: FormData,
): Promise<EmailLinkState> {
  const email = readEmail(formData);

  if (!email || !email.includes("@")) {
    return { status: "error", message: "올바른 이메일 주소를 입력해 주세요." };
  }

  const supabase = await createClient();
  const origin = await getSiteOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
      SET_PASSWORD_PATH,
    )}`,
  });

  if (error) {
    console.error(
      "[sendPasswordResetLink]",
      error.status,
      error.code,
      error.message,
    );
    return {
      status: "error",
      message: "메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.",
    };
  }

  return { status: "sent", email };
}

// 이메일 + 비밀번호 로그인. 성공하면 next(없으면 /today)로 이동한다.
export async function signInWithPassword(
  _prevState: PasswordAuthState,
  formData: FormData,
): Promise<PasswordAuthState> {
  const email = readEmail(formData);
  const password = String(formData.get("password") ?? "");
  const nextRaw = String(formData.get("next") ?? "");
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/today";

  if (!email || !password) {
    return { status: "error", message: "이메일과 비밀번호를 모두 입력해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("[signInWithPassword]", error.status, error.code, error.message);
    return {
      status: "error",
      message: "이메일 또는 비밀번호가 올바르지 않아요.",
    };
  }

  redirect(next);
}

// 현재 로그인된 세션에 비밀번호를 설정/변경한다.
// (가입 링크 또는 재설정 링크로 도착해 세션이 있는 상태에서 호출됨)
export async function setPassword(
  _prevState: PasswordAuthState,
  formData: FormData,
): Promise<PasswordAuthState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      status: "error",
      message: `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 해요.`,
    };
  }
  if (password !== confirm) {
    return { status: "error", message: "두 비밀번호가 서로 달라요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "링크가 만료됐어요. 메일의 링크를 다시 눌러 주세요.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("[setPassword]", error.status, error.code, error.message);
    // 새 비밀번호가 기존과 같을 때 등
    return {
      status: "error",
      message:
        error.code === "same_password"
          ? "기존 비밀번호와 다른 비밀번호를 입력해 주세요."
          : "비밀번호를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
    };
  }

  redirect("/today");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
