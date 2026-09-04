import { createClient } from "@/lib/supabase/server";

// 서버 액션/쿼리에서 공통으로 쓰는 인증 확인. 세션이 없으면 예외를 던진다 —
// 어차피 proxy.ts가 /today 등 보호 경로를 먼저 막지만, 서버 액션은 직접
// 호출될 수 있으므로 여기서도 한 번 더 확인한다.
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  return { supabase, user };
}
