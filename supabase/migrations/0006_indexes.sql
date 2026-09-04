-- 조회 패턴에 맞춘 인덱스.
create index idx_routines_user_active
  on public.routines (user_id)
  where archived_at is null and deleted_at is null;

create index idx_routine_logs_user_date
  on public.routine_logs (user_id, log_date desc);

create index idx_todos_user_date
  on public.todos (user_id, todo_date)
  where deleted_at is null;
