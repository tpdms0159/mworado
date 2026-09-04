-- 반복 루틴 "템플릿". 그날그날의 완료 기록(routine_logs)과 분리되어 있어
-- 이름을 바꾸거나 보관/삭제해도 과거 기록이 훼손되지 않는다.
create table public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  -- daily: 매일 / weekday: 특정 요일 / weekly_n: 주 N회 / every_other_day: 격일
  repeat_type text not null check (repeat_type in ('daily', 'weekday', 'weekly_n', 'every_other_day')),
  -- daily:            {}
  -- weekday:          { "weekdays": [1,3,5] }  (0=일 .. 6=토)
  -- weekly_n:         { "times_per_week": 3 }
  -- every_other_day:  { "anchor_date": "2026-01-01" }
  repeat_config jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  archived_at timestamptz,  -- 보관: 활성 목록에서만 내림, 기록은 유지
  deleted_at timestamptz,   -- soft delete: 물리 삭제하지 않음
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
