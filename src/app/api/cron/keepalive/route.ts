import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Vercel Cron이 매일 호출해 Supabase 무료 프로젝트가 비활동으로 일시정지되지 않게 한다.
// (Supabase 무료 티어는 약 7일간 활동이 없으면 프로젝트를 일시정지한다.)
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  await supabase.from("profiles").select("id").limit(1);

  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}
