-- 루틴의 "그날의 완료 기록". 템플릿(routines)과 분리 저장.
-- user_id 를 비정규화해서 RLS 정책과 인덱스를 routines 조인 없이 단순하게 유지한다.
create table public.routine_logs (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,  -- 사용자 로컬 날짜(day_start_hour 반영 완료된 값). UTC 타임스탬프 아님.
  completed boolean not null default true,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (routine_id, log_date)
);
