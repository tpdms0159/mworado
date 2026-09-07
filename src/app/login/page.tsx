import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "로그인",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : undefined;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <Link href="/" className="text-2xl font-semibold">
          뭐라도해야지
        </Link>
        <p className="text-muted-foreground mt-2 text-sm">
          이메일과 비밀번호로 로그인하세요.
        </p>
      </div>
      <div className="w-full max-w-sm space-y-4">
        {error === "auth" && (
          <p className="text-destructive text-center text-sm" role="alert">
            링크가 만료됐거나 이미 사용됐어요. 다시 시도해 주세요.
          </p>
        )}
        <LoginForm next={safeNext} />
      </div>
    </main>
  );
}
