create table if not exists public.ai_provider_config_history (
  id bigint generated always as identity primary key,
  model text not null,
  action text not null check (action in ('saved', 'key_removed', 'existing')),
  api_key_changed boolean not null default false,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.ai_provider_config_history enable row level security;
revoke all on table public.ai_provider_config_history from public, anon, authenticated;
grant all on table public.ai_provider_config_history to service_role;

create index if not exists ai_provider_config_history_created_at_idx
  on public.ai_provider_config_history (created_at desc);

alter table public.ai_provider_secrets add column if not exists updated_by uuid references auth.users(id) on delete set null;

insert into public.ai_provider_config_history (model, action, api_key_changed, changed_by, created_at)
select
  coalesce((select value from public.app_settings where key = 'ai_openrouter_model'), 'openai/gpt-4o-mini'),
  'existing',
  exists(select 1 from public.ai_provider_secrets where provider = 'openrouter'),
  (select updated_by from public.ai_provider_secrets where provider = 'openrouter'),
  coalesce((select updated_at from public.ai_provider_secrets where provider = 'openrouter'), now())
where not exists (select 1 from public.ai_provider_config_history);