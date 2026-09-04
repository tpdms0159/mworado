import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/layout/app-nav";
import { GrassGraph } from "@/components/stats/grass-graph";
import { RoutineCompletionChart } from "@/components/stats/routine-completion-chart";
import { StreakSummary } from "@/components/stats/streak-summary";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getStatsView } from "@/server/queries/stats";

export const metadata: Metadata = {
  title: "기록 | 뭐라도해야지",
};

export default async function StatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { grassDays, currentStreak, longestStreak, last30DaysRate, routineStats, hasAnyData } =
    await getStatsView();

  return (
    <div className="flex flex-1 flex-col gap-2">
      <header className="p-4 pb-0">
        <AppNav />
      </header>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4">
        <h1 className="text-lg font-semibold">기록</h1>

        {!hasAnyData ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-muted-foreground text-base">
              아직 쌓인 기록이 없어요. 오늘 하나만 해보면 여기 첫 칸이 채워져요.
            </p>
            <Button render={<Link href="/today" />} size="sm">
              오늘 화면으로
            </Button>
          </div>
        ) : (
          <>
            <StreakSummary
              currentStreak={currentStreak}
              longestStreak={longestStreak}
              last30DaysRate={last30DaysRate}
            />
            <GrassGraph days={grassDays} />
            {routineStats.length > 0 && (
              <div className="flex flex-col gap-2">
                <h2 className="text-sm font-medium">루틴별 달성률 (최근 30일)</h2>
                <RoutineCompletionChart stats={routineStats} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
