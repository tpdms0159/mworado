import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// service role 키를 사용하는 관리자 클라이언트.
// "server-only" import 때문에 클라이언트 컴포넌트에서 이 파일을 import하면 빌드가 실패한다 —
// 서비스 롤 키가 브라우저 번들에 노출되는 사고를 원천 차단하기 위함.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
