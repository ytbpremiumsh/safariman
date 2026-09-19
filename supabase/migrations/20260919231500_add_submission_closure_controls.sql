insert into public.app_settings (key, value, updated_at)
values
  ('registration_open', 'false', now()),
  ('berkas_submission_open', 'false', now()),
  ('essay_submission_open', 'false', now())
on conflict (key) do nothing;

create or replace function public.get_submission_availability()
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $$
  select jsonb_build_object(
    'registration_open', coalesce((select value from public.app_settings where key = 'registration_open' limit 1), 'false') = 'true',
    'berkas_open', coalesce((select value from public.app_settings where key = 'berkas_submission_open' limit 1), 'false') = 'true',
    'essay_open', coalesce((select value from public.app_settings where key = 'essay_submission_open' limit 1), 'false') = 'true'
  );
$$;

revoke all on function public.get_submission_availability() from public;
grant execute on function public.get_submission_availability() to anon, authenticated, service_role;

create or replace function public.enforce_submission_closure()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_is_admin boolean := false;
  v_is_service boolean := coalesce(auth.jwt() ->> 'role', '') = 'service_role';
  v_registration_open boolean;
  v_berkas_open boolean;
  v_essay_open boolean;
begin
  if auth.uid() is not null then
    v_is_admin := public.has_role(auth.uid(), 'admin'::public.app_role);
  end if;

  if v_is_service or v_is_admin then
    return new;
  end if;

  if tg_op = 'INSERT' then
    select coalesce((select value from public.app_settings where key = 'registration_open' limit 1), 'false') = 'true'
      into v_registration_open;
    if not v_registration_open then
      raise exception using errcode = 'P0001', message = 'Pendaftaran telah ditutup oleh admin';
    end if;
    return new;
  end if;

  select
    coalesce((select value from public.app_settings where key = 'berkas_submission_open' limit 1), 'false') = 'true',
    coalesce((select value from public.app_settings where key = 'essay_submission_open' limit 1), 'false') = 'true'
  into v_berkas_open, v_essay_open;

  if (new.cv_url is distinct from old.cv_url or new.photo_url is distinct from old.photo_url) and not v_berkas_open then
    raise exception using errcode = 'P0001', message = 'Pengiriman berkas telah ditutup oleh admin';
  end if;

  if (
    new.essay_worthy is distinct from old.essay_worthy
    or new.essay_dream is distinct from old.essay_dream
    or new.essay_contribution is distinct from old.essay_contribution
    or new.case_study_1 is distinct from old.case_study_1
    or new.case_study_2 is distinct from old.case_study_2
    or new.case_study_3 is distinct from old.case_study_3
    or new.case_study_4 is distinct from old.case_study_4
    or new.case_study_5 is distinct from old.case_study_5
    or new.case_study_6 is distinct from old.case_study_6
    or new.case_study_7 is distinct from old.case_study_7
  ) and not v_essay_open then
    raise exception using errcode = 'P0001', message = 'Pengiriman Essay dan Studi Kasus telah ditutup oleh admin';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_submission_closure() from public, anon, authenticated;

drop trigger if exists enforce_registration_closure on public.participants;
create trigger enforce_registration_closure
before insert on public.participants
for each row execute function public.enforce_submission_closure();

drop trigger if exists enforce_berkas_and_essay_closure on public.participants;
create trigger enforce_berkas_and_essay_closure
before update of cv_url, photo_url, essay_worthy, essay_dream, essay_contribution,
  case_study_1, case_study_2, case_study_3, case_study_4, case_study_5, case_study_6, case_study_7
on public.participants
for each row execute function public.enforce_submission_closure();
