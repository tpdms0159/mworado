import Link from "next/link";
import { Button } from "@/components/ui/button";

// M0 자리표시 랜딩 — 실제 스크린샷/카피가 들어간 최종 랜딩은 M4에서 완성한다.
export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        뭐라도해야지
      </h1>
      <p className="text-muted-foreground max-w-md text-balance">
        완벽하지 않아도 돼. 오늘 뭐라도 하나만.
      </p>
      <Button render={<Link href="/login" />} size="lg">
        시작하기
      </Button>
    </main>
  );
}
