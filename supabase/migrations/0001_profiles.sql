-- 사용자별 설정. auth.users 와 1:1.
-- day_start_hour: "하루의 시작 시각" — 새벽 이 시각 이전의 체크는 전날로 집계한다.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'Asia/Seoul',
  day_start_hour smallint not null default 4 check (day_start_hour between 0 and 23),
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 신규 가입 시 profiles 행을 자동 생성.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
