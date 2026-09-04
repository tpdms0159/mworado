import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RoutineList } from "@/components/routines/routine-list";
import { createClient } from "@/lib/supabase/server";
import { getRoutines } from "@/server/queries/routines";

export const metadata: Metadata = {
  title: "루틴",
};

export default async function RoutinesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const routines = await getRoutines();

  return <RoutineList initialRoutines={routines} />;
}
