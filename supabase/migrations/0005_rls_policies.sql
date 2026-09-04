-- 모든 테이블에 RLS를 걸어 다른 사용자의 데이터가 절대 조회/변경되지 않게 한다.
-- 패턴: auth.uid() = user_id (또는 profiles.id) 인 행만 select/insert/update/delete 허용.

alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
-- insert는 handle_new_user 트리거(security definer)가 처리하므로 별도 insert 정책 없음.
-- delete는 auth.users 삭제 시 on delete cascade로 처리하므로 별도 delete 정책 없음.

alter table public.routines enable row level security;
create policy "routines_select_own" on public.routines
  for select using (auth.uid() = user_id);
create policy "routines_insert_own" on public.routines
  for insert with check (auth.uid() = user_id);
create policy "routines_update_own" on public.routines
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "routines_delete_own" on public.routines
  for delete using (auth.uid() = user_id);

alter table public.routine_logs enable row level security;
create policy "routine_logs_select_own" on public.routine_logs
  for select using (auth.uid() = user_id);
create policy "routine_logs_insert_own" on public.routine_logs
  for insert with check (auth.uid() = user_id);
create policy "routine_logs_update_own" on public.routine_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "routine_logs_delete_own" on public.routine_logs
  for delete using (auth.uid() = user_id);

alter table public.todos enable row level security;
create policy "todos_select_own" on public.todos
  for select using (auth.uid() = user_id);
create policy "todos_insert_own" on public.todos
  for insert with check (auth.uid() = user_id);
create policy "todos_update_own" on public.todos
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "todos_delete_own" on public.todos
  for delete using (auth.uid() = user_id);
