import type { Metadata } from "next";
import Link from "next/link";
import { EmailLinkForm } from "@/components/auth/email-link-form";
import { sendPasswordResetLink } from "@/server/actions/auth";

export const metadata: Metadata = {
  title: "비밀번호 재설정",
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <Link href="/" className="text-2xl font-semibold">
          뭐라도해야지
        </Link>
        <p className="text-muted-foreground mt-2 text-sm">
          가입한 이메일 주소를 입력하면 비밀번호를 다시 설정할 수 있는 링크를
          보내드려요.
        </p>
      </div>
      <div className="w-full max-w-sm space-y-4">
        <EmailLinkForm
          action={sendPasswordResetLink}
          submitLabel="재설정 링크 받기"
          pendingLabel="보내는 중..."
          sentTitle="메일함을 확인해 주세요"
          sentDescription="{email} 주소로 재설정 링크를 보냈어요. 가입된 계정이라면 메일이 도착해요."
        />
        <p className="text-muted-foreground text-center text-sm">
          <Link
            href="/login"
            className="text-foreground underline underline-offset-2"
          >
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </main>
  );
}
