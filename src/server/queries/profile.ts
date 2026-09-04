import { createClient } from "@/lib/supabase/server";

export type UserProfile = {
  timezone: string;
  dayStartHour: number;
};

const DEFAULT_PROFILE: UserProfile = { timezone: "Asia/Seoul", dayStartHour: 4 };

// profiles 행은 회원가입 시 트리거로 항상 생성되지만, 조회 실패 시에도
// 앱이 죽지 않도록 기본값으로 폴백한다.
export async function getCurrentProfile(userId: string): Promise<UserProfile> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("timezone, day_start_hour")
    .eq("id", userId)
    .single();

  if (!data) return DEFAULT_PROFILE;

  return {
    timezone: data.timezone ?? DEFAULT_PROFILE.timezone,
    dayStartHour: data.day_start_hour ?? DEFAULT_PROFILE.dayStartHour,
  };
}
