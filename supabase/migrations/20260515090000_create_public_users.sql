-- public.users — Vaulx app-level user data, 1:1 with auth.users.
--
-- Pattern: https://supabase.com/docs/guides/auth/managing-user-data
-- Future tables (loans, assets, evaluations) FK to public.users.id.

begin;

create type public.user_role as enum (
  'borrower',
  'admin',
  'evaluator_online',
  'evaluator_offline'
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role public.user_role not null default 'borrower',
  display_name text,
  solana_address text unique,            -- b58 pubkey, set via SIWS in Wave 2.3
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index users_role_idx on public.users (role);
create index users_solana_address_idx on public.users (solana_address)
  where solana_address is not null;

-- Trigger: keep public.users.email in sync with auth.users.email
create or replace function public.handle_auth_user_email_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.users set email = new.email, updated_at = now()
    where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_auth_user_email_change();

-- Trigger: auto-create public.users row when auth.users is created
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'borrower');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- RLS
alter table public.users enable row level security;

-- Each user can read + update their own row
create policy users_self_read on public.users
  for select using (auth.uid() = id);

create policy users_self_update on public.users
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins can read all rows (for the future admin portal in Wave 6)
create policy users_admin_read on public.users
  for select using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- updated_at touch trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_touch_updated_at
  before update on public.users
  for each row execute function public.touch_updated_at();

commit;
