-- RLS check for public.progress. Paste into the Supabase SQL editor and run.
-- Everything runs in one transaction that is rolled back, so no test data is left behind.
-- Success: a single row "RLS check passed". Failure: an error naming the broken rule.

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'rls-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'rls-b@example.test');

-- User A writes and reads their own row.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
insert into public.progress (kind, item_id, value) values ('task', 'd1-0', 'true');
do $$ begin
  if (select count(*) from public.progress) <> 1 then raise exception 'user A cannot see their own row'; end if;
end $$;

-- User B cannot see, write as, update or delete user A's data.
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
do $$ begin
  if (select count(*) from public.progress) <> 0 then raise exception 'user B can see user A''s rows'; end if;

  begin
    insert into public.progress (user_id, kind, item_id, value)
      values ('00000000-0000-0000-0000-00000000000a', 'task', 'x', 'true');
    raise exception 'user B could insert a row as user A';
  exception when insufficient_privilege then null; -- expected
  end;

  update public.progress set value = 'false' where user_id = '00000000-0000-0000-0000-00000000000a';
  if found then raise exception 'user B updated user A''s row'; end if;

  delete from public.progress where user_id = '00000000-0000-0000-0000-00000000000a';
  if found then raise exception 'user B deleted user A''s row'; end if;
end $$;

-- Signed-out visitors cannot read anything.
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
do $$ begin
  begin
    perform count(*) from public.progress;
    raise exception 'anon can read public.progress';
  exception when insufficient_privilege then null; -- expected
  end;
end $$;

select 'RLS check passed' as result;

rollback;
