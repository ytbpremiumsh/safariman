-- Password-protected schedules for the ten Safar Iman interview candidates.
create table if not exists public.interview_schedules (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null unique references public.participants(id) on delete cascade,
  schedule_date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interview_schedules_valid_time check (end_time > start_time)
);

alter table public.interview_schedules enable row level security;
revoke all on table public.interview_schedules from public, anon, authenticated;
grant all on table public.interview_schedules to service_role;

create index if not exists interview_schedules_date_time_idx
  on public.interview_schedules(schedule_date, start_time);

create or replace function public.get_interview_schedules_with_password(_password text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  configured_password text;
  result jsonb;
begin
  select value into configured_password
  from public.app_settings
  where key = 'stats_password';

  if configured_password is null or btrim(configured_password) = '' then
    return jsonb_build_object('ok', false, 'error', 'not_configured');
  end if;

  if _password is null or _password <> configured_password then
    return jsonb_build_object('ok', false, 'error', 'wrong_password');
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', schedule.id,
        'participant_id', schedule.participant_id,
        'registration_code', participant.registration_code,
        'full_name', participant.full_name,
        'email', participant.email,
        'schedule_date', schedule.schedule_date,
        'start_time', to_char(schedule.start_time, 'HH24:MI'),
        'end_time', to_char(schedule.end_time, 'HH24:MI'),
        'updated_at', schedule.updated_at
      ) order by schedule.schedule_date, schedule.start_time
    ),
    '[]'::jsonb
  ) into result
  from public.interview_schedules as schedule
  join public.participants as participant on participant.id = schedule.participant_id;

  return jsonb_build_object('ok', true, 'schedules', result);
end;
$$;

create or replace function public.save_interview_schedule_with_password(
  _password text,
  _participant_id uuid,
  _schedule_date date,
  _start_time time,
  _end_time time
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  configured_password text;
  candidate public.participants%rowtype;
  saved public.interview_schedules%rowtype;
begin
  select value into configured_password
  from public.app_settings
  where key = 'stats_password';

  if configured_password is null or btrim(configured_password) = '' then
    return jsonb_build_object('ok', false, 'error', 'not_configured');
  end if;

  if _password is null or _password <> configured_password then
    return jsonb_build_object('ok', false, 'error', 'wrong_password');
  end if;

  if _schedule_date is null or _start_time is null or _end_time is null then
    return jsonb_build_object('ok', false, 'error', 'incomplete_schedule');
  end if;

  if _end_time <= _start_time then
    return jsonb_build_object('ok', false, 'error', 'invalid_time_range');
  end if;

  select * into candidate
  from public.participants
  where id = _participant_id
    and registration_code = any(array[
      'HXP-D22C8CD3', 'HXP-EF20D8B0', 'HXP-F8D9FEF7', 'HXP-C633AB4E',
      'HXP-2B4820D0', 'HXP-A637F534', 'HXP-3C53A06B', 'HXP-F0E85D64',
      'HXP-AD4F867B', 'HXP-B47F06A4'
    ]::text[]);

  if candidate.id is null then
    return jsonb_build_object('ok', false, 'error', 'participant_not_allowed');
  end if;

  insert into public.interview_schedules (
    participant_id, schedule_date, start_time, end_time, updated_at
  ) values (
    _participant_id, _schedule_date, _start_time, _end_time, now()
  )
  on conflict (participant_id) do update set
    schedule_date = excluded.schedule_date,
    start_time = excluded.start_time,
    end_time = excluded.end_time,
    updated_at = now()
  returning * into saved;

  return jsonb_build_object(
    'ok', true,
    'schedule', jsonb_build_object(
      'id', saved.id,
      'participant_id', saved.participant_id,
      'registration_code', candidate.registration_code,
      'full_name', candidate.full_name,
      'email', candidate.email,
      'schedule_date', saved.schedule_date,
      'start_time', to_char(saved.start_time, 'HH24:MI'),
      'end_time', to_char(saved.end_time, 'HH24:MI'),
      'updated_at', saved.updated_at
    )
  );
end;
$$;

-- Initial schedule based on the approved interview rundown.
insert into public.interview_schedules (participant_id, schedule_date, start_time, end_time)
select participant.id, values.schedule_date, values.start_time, values.end_time
from (
  values
    ('HXP-D22C8CD3', date '2026-10-03', time '13:00', time '13:25'),
    ('HXP-EF20D8B0', date '2026-10-03', time '13:30', time '13:55'),
    ('HXP-F8D9FEF7', date '2026-10-03', time '14:00', time '14:25'),
    ('HXP-C633AB4E', date '2026-10-03', time '14:30', time '14:55'),
    ('HXP-2B4820D0', date '2026-10-03', time '15:00', time '15:25'),
    ('HXP-A637F534', date '2026-10-03', time '15:45', time '16:10'),
    ('HXP-3C53A06B', date '2026-10-03', time '16:15', time '16:40'),
    ('HXP-F0E85D64', date '2026-10-03', time '16:45', time '17:10'),
    ('HXP-AD4F867B', date '2026-10-03', time '17:15', time '17:40'),
    ('HXP-B47F06A4', date '2026-10-03', time '18:00', time '18:25')
) as values(registration_code, schedule_date, start_time, end_time)
join public.participants as participant
  on participant.registration_code = values.registration_code
on conflict (participant_id) do nothing;

revoke all on function public.get_interview_schedules_with_password(text) from public;
revoke all on function public.save_interview_schedule_with_password(text, uuid, date, time, time)
  from public;

grant execute on function public.get_interview_schedules_with_password(text)
  to anon, authenticated, service_role;
grant execute on function public.save_interview_schedule_with_password(text, uuid, date, time, time)
  to anon, authenticated, service_role;

notify pgrst, 'reload schema';
