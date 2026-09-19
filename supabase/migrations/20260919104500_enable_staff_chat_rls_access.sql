create schema if not exists private;

create or replace function private.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.staff_reviewers
      where user_id = (select auth.uid()) and active = true
    );
$function$;

create or replace function private.set_staff_chat_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare v_name text;
begin
  select name into v_name
  from public.staff_reviewers
  where user_id = (select auth.uid()) and active = true;
  if v_name is null then raise exception 'Akun staff tidak aktif'; end if;
  new.staff_user_id := (select auth.uid());
  new.staff_name := v_name;
  return new;
end;
$function$;

revoke all on function private.is_active_staff() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_active_staff() to authenticated;
revoke all on function private.set_staff_chat_identity() from public;

drop trigger if exists set_staff_chat_identity on public.staff_group_messages;
create trigger set_staff_chat_identity
before insert on public.staff_group_messages
for each row execute function private.set_staff_chat_identity();

drop policy if exists "Active staff can read group chat" on public.staff_group_messages;
create policy "Active staff can read group chat"
on public.staff_group_messages for select to authenticated
using ((select private.is_active_staff()));

drop policy if exists "Active staff can send group chat" on public.staff_group_messages;
create policy "Active staff can send group chat"
on public.staff_group_messages for insert to authenticated
with check ((select private.is_active_staff()) and staff_user_id = (select auth.uid()));

grant select, insert on public.staff_group_messages to authenticated;
revoke all on public.staff_group_messages from anon;
