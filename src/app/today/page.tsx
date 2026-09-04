import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTodayTodos } from "@/server/queries/today";
import { signOut } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { TodayList } from "@/components/today/today-list";

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

  const { todos } = await getTodayTodos();

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-md items-center justify-between p-4 pb-0">
        <h1 className="text-lg font-semibold">오늘</h1>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            로그아웃
          </Button>
        </form>
      </header>
      <TodayList initialTodos={todos} />
    </div>
  );
}
