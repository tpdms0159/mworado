import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "오늘 | 뭐라도해야지",
};

// M0 자리표시 화면 — 오늘 목록 UI는 M1에서 만든다.
// 지금은 인증 흐름이 실제로 동작하는지 확인하는 용도.
export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-muted-foreground text-sm">
        오늘 화면은 다음 마일스톤(M1)에서 만들어져요. 지금은 로그인이 잘 되는지 확인하는 자리예요.
      </p>
      <p className="text-lg font-medium">{user.email} 님, 안녕하세요.</p>
      <form action={signOut}>
        <Button type="submit" variant="outline">
          로그아웃
        </Button>
      </form>
    </main>
  );
}
