-- Per-user progress for the learning hub.
-- One row per checkbox, note, story, spend entry or hours entry, so two devices never overwrite
-- each other's whole state. Curriculum content is not stored here; it lives in data/roadmap.yaml.

create table public.progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in (
    'task', 'resource', 'checkpoint', 'deliverable', 'mock', 'dsa',
    'flashcard', 'note', 'star', 'spend', 'hours', 'setting'
  )),
  item_id text not null check (char_length(item_id) between 1 and 100),
  value jsonb not null check (octet_length(value::text) <= 20000),
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, item_id)
);

alter table public.progress enable row level security;

create policy "Users read own progress" on public.progress
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert own progress" on public.progress
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own progress" on public.progress
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own progress" on public.progress
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Signed-out visitors get nothing; signed-in users get only what the policies above allow.
revoke all on public.progress from anon;
grant select, insert, update, delete on public.progress to authenticated;

-- Cap rows per user so one account cannot fill the free-plan database.
-- A full 60 days of heavy use is roughly 1,500 rows.
create function public.progress_row_limit() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (select count(*) from public.progress where user_id = new.user_id) >= 5000 then
    raise exception 'progress row limit (5000) reached';
  end if;
  return new;
end;
$$;

create trigger progress_row_limit
  before insert on public.progress
  for each row execute function public.progress_row_limit();
