-- Halaman private seleksi essay/studi kasus
create table public.seleksi_private_tokens (
    id uuid primary key default gen_random_uuid(),
    token text not null unique,
    created_at timestamptz default now(),
    expires_at timestamptz not null
);

grant select, insert, delete on public.seleksi_private_tokens to authenticated;
grant all on public.seleksi_private_tokens to service_role;

alter table public.seleksi_private_tokens enable row level security;

create policy "Admins can manage tokens" on public.seleksi_private_tokens
for all to authenticated using (public.has_role(auth.uid(), 'admin'));
