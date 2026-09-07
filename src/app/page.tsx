import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GrassGraph } from "@/components/stats/grass-graph";
import type { GrassDay } from "@/server/queries/stats";
import { addDaysToDateString, getCurrentLocalDateString } from "@/lib/date/local-date";

const VALUE_PROPS = [
  {
    title: "오늘 화면 하나로 끝난다",
    description: "열자마자 오늘 할 일만 보여요. 어제도, 다음 주도 신경 쓸 필요 없어요.",
  },
  {
    title: "반복 루틴은 자동으로 생긴다",
    description: "매일 하는 일은 한 번만 등록해두면 매일 알아서 오늘 목록에 나타나요.",
  },
  {
    title: "해온 기록이 눈에 쌓인다",
    description: "잔디와 연속일로 꾸준함이 보여요. 며칠 빠져도 괜찮아요, 다시 하면 그만이에요.",
  },
];

// 랜딩용 예시 잔디 — 실제 데이터가 아니라 완료율 패턴을 보여주기 위한 데모용 값.
function buildSampleGrassDays(): GrassDay[] {
  const today = getCurrentLocalDateString("Asia/Seoul", 4);
  const pattern: GrassDay["level"][] = [3, 4, 0, 2, 4, 1, 3, 4, 2, 0, 4, 3];
  const days: GrassDay[] = [];
  for (let i = 90; i >= 0; i--) {
    const date = addDaysToDateString(today, -i);
    const level = pattern[i % pattern.length];
    days.push({ date, planned: level === 0 ? 0 : 4, completed: level === 0 ? 0 : level, level });
  }
  return days;
}

export default function LandingPage() {
  const sampleDays = buildSampleGrassDays();

  return (
    <main className="flex flex-1 flex-col">
      <section className="flex flex-col items-center gap-6 px-6 pt-20 pb-16 text-center">
        <span className="text-muted-foreground text-sm font-medium">뭐라도해야지</span>
        <h1 className="max-w-lg text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          완벽하지 않아도 돼. 오늘 뭐라도 하나만.
        </h1>
        <p className="text-muted-foreground max-w-md text-balance">
          매일 할 일과 반복 루틴을 체크하고, 꾸준함을 잔디로 확인하는 개인용 데일리 체크 앱.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button render={<Link href="/signup" />} size="lg">
            시작하기
          </Button>
          <Button render={<Link href="/demo" />} size="lg" variant="outline">
            체험해보기
          </Button>
        </div>
      </section>

      <section className="mx-auto w-full max-w-md px-6 pb-16">
        <div className="border-border bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground mb-3 text-xs">최근 기록 (예시)</p>
          <GrassGraph days={sampleDays} />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-3xl gap-6 px-6 pb-24 sm:grid-cols-3">
        {VALUE_PROPS.map((item) => (
          <div key={item.title} className="flex flex-col gap-1.5 text-center sm:text-left">
            <h2 className="text-base font-medium">{item.title}</h2>
            <p className="text-muted-foreground text-sm">{item.description}</p>
          </div>
        ))}
      </section>

      <section className="border-border flex flex-col items-center gap-4 border-t px-6 py-16 text-center">
        <p className="text-muted-foreground text-base">오늘 하나, 뭐라도 해볼까?</p>
        <Button render={<Link href="/login" />} size="lg">
          시작하기
        </Button>
      </section>
    </main>
  );
}
