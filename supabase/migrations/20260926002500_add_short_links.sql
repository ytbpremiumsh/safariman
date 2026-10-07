create table if not exists public.short_links (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null default '',
  target_url text not null,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint short_links_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and char_length(slug) between 2 and 80
  ),
  constraint short_links_target_url_http check (
    target_url ~* '^https?://'
  )
);

create unique index if not exists short_links_slug_lower_uidx
  on public.short_links (lower(slug));

create index if not exists short_links_active_slug_idx
  on public.short_links (slug)
  where is_active = true;

alter table public.short_links enable row level security;

drop policy if exists "public read active short links" on public.short_links;
create policy "public read active short links"
  on public.short_links
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "admin read all short links" on public.short_links;
create policy "admin read all short links"
  on public.short_links
  for select
  to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists "admin insert short links" on public.short_links;
create policy "admin insert short links"
  on public.short_links
  for insert
  to authenticated
  with check ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists "admin update short links" on public.short_links;
create policy "admin update short links"
  on public.short_links
  for update
  to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)))
  with check ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists "admin delete short links" on public.short_links;
create policy "admin delete short links"
  on public.short_links
  for delete
  to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));

revoke all on public.short_links from anon, authenticated;
grant select on public.short_links to anon, authenticated;
grant insert, update, delete on public.short_links to authenticated;

create or replace function public.set_short_link_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_short_link_updated_at() from public, anon, authenticated;

drop trigger if exists set_short_link_updated_at on public.short_links;
create trigger set_short_link_updated_at
before update on public.short_links
for each row execute function public.set_short_link_updated_at();
