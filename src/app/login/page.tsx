import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "로그인",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <Link href="/" className="text-2xl font-semibold">
          뭐라도해야지
        </Link>
        <p className="text-muted-foreground mt-2 text-sm">
          이메일로 로그인 링크를 받아요. 비밀번호는 필요 없어요.
        </p>
      </div>
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </main>
  );
}
