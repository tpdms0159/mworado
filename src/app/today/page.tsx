import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTodayView } from "@/server/queries/today";
import { signOut } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { TodayList } from "@/components/today/today-list";
import { AppNav } from "@/components/layout/app-nav";

export const metadata: Metadata = {
  title: "오늘 | 뭐라도해야지",
};

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { todos, routines } = await getTodayView();

  return (
    <div className="flex flex-1 flex-col gap-2">
      <header className="mx-auto flex w-full max-w-md items-center justify-between p-4 pb-0">
        <AppNav />
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            로그아웃
          </Button>
        </form>
      </header>
      <TodayList initialTodos={todos} initialRoutines={routines} />
    </div>
  );
}
