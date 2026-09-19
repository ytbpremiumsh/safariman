create table if not exists public.staff_group_messages (
  id uuid primary key default gen_random_uuid(),
  staff_user_id uuid not null,
  staff_name text not null check (char_length(staff_name) between 1 and 150),
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists staff_group_messages_created_at_idx on public.staff_group_messages(created_at desc);
alter table public.staff_group_messages enable row level security;
revoke all on table public.staff_group_messages from anon, authenticated;
comment on table public.staff_group_messages is 'Chat internal yang hanya diakses melalui Edge Function setelah akun staff aktif diverifikasi.';