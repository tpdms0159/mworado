import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 가입/재설정 메일 링크와 OAuth 리다이렉트가 도착하는 지점.
// code를 세션으로 교환한 뒤 next로 이동한다.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // open redirect 방지: 같은 사이트 내부 경로만 허용한다.
  const nextRaw = searchParams.get("next") ?? "/today";
  const next =
    nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/today";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
