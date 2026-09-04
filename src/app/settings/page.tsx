import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/layout/app-nav";
import { SettingsForm } from "@/components/settings/settings-form";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/server/queries/profile";

export const metadata: Metadata = {
  title: "설정",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile(user.id);

  return (
    <div className="flex flex-1 flex-col gap-2">
      <header className="p-4 pb-0">
        <AppNav />
      </header>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
        <h1 className="text-lg font-semibold">설정</h1>
        <SettingsForm email={user.email ?? ""} dayStartHour={profile.dayStartHour} />
      </div>
    </div>
  );
}
