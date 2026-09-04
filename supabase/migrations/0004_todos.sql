-- 일회성 할 일.
create table public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  todo_date date not null,  -- 사용자 로컬 날짜(day_start_hour 반영). UTC 타임스탬프 아님.
  completed boolean not null default false,
  completed_at timestamptz,
  sort_order int not null default 0,
  deleted_at timestamptz,  -- soft delete: 5초 "실행 취소" 토스트 + 내보내기 무결성을 위해 물리 삭제하지 않음
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
