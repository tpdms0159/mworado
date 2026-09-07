import type { Metadata } from "next";
import Link from "next/link";
import { EmailLinkForm } from "@/components/auth/email-link-form";
import { sendSignUpLink } from "@/server/actions/auth";

export const metadata: Metadata = {
  title: "가입하기",
};

export default function SignUpPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <Link href="/" className="text-2xl font-semibold">
          뭐라도해야지
        </Link>
        <p className="text-muted-foreground mt-2 text-sm">
          이메일 주소를 입력하면 가입 링크를 보내드려요. 링크를 누르면 비밀번호를
          정하고 바로 시작할 수 있어요.
        </p>
      </div>
      <div className="w-full max-w-sm space-y-4">
        <EmailLinkForm
          action={sendSignUpLink}
          submitLabel="가입 링크 받기"
          pendingLabel="보내는 중..."
          sentTitle="메일함을 확인해 주세요"
          sentDescription="{email} 주소로 가입 링크를 보냈어요. 링크를 누르면 비밀번호 설정 화면으로 이동해요."
        />
        <p className="text-muted-foreground text-center text-sm">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/login"
            className="text-foreground underline underline-offset-2"
          >
            로그인
          </Link>
        </p>
      </div>
    </main>
  );
}
