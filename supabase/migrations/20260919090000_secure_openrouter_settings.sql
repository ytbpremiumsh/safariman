create table if not exists public.ai_provider_secrets (
  provider text primary key check (provider in ('openrouter')),
  api_key text not null check (length(api_key) >= 20),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_provider_secrets enable row level security;
revoke all on table public.ai_provider_secrets from public, anon, authenticated;
grant all on table public.ai_provider_secrets to service_role;

insert into public.app_settings (key, value)
values ('ai_provider', 'openrouter')
on conflict (key) do update set value = excluded.value;

insert into public.app_settings (key, value)
values ('ai_openrouter_model', 'openai/gpt-4o-mini')
on conflict (key) do nothing;
