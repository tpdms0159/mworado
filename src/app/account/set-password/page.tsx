import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SetPasswordForm } from "@/components/auth/set-password-form";

export const metadata: Metadata = {
  title: "비밀번호 설정",
};

export default async function SetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=auth");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <p className="text-2xl font-semibold">비밀번호 설정</p>
        <p className="text-muted-foreground mt-2 text-sm">
          {user.email} 계정에서 사용할 비밀번호를 정해 주세요. 다음부터는 이메일과
          비밀번호로 로그인해요.
        </p>
      </div>
      <div className="w-full max-w-sm">
        <SetPasswordForm />
      </div>
    </main>
  );
}
