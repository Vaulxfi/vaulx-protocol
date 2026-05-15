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
-- Note: the inline `unique` on solana_address already creates a btree index
-- covering the column. No separate partial index needed.

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

-- Admins can read all rows (for the future admin portal in Wave 6).
--
-- Implementation note: the admin check is wrapped in a SECURITY DEFINER
-- function rather than inlined as `EXISTS (SELECT FROM public.users ...)`
-- because the latter triggers Postgres "42P17 infinite recursion detected
-- in policy for relation \"users\"". The function bypasses RLS for its
-- internal query (search_path locked to public to prevent schema-search
-- hijack); the policy itself only calls the function, so no recursion.
-- Standard Supabase pattern: https://supabase.com/docs/guides/database/postgres/row-level-security#user-role-check
create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

create policy users_admin_read on public.users
  for select using (public.current_user_is_admin());

-- Role-escalation guard (architect addition, not in the original PR #18).
--
-- The `users_self_update` policy above allows a user to UPDATE their own
-- row, but Postgres RLS `with check` does NOT restrict which columns can
-- change — only that the new row still satisfies the condition. Without
-- this trigger, an authenticated user could PATCH /rest/v1/users with
-- `{"role":"admin"}` against their own id and Supabase would accept it
-- (RLS passes, id is unchanged), silently elevating them to admin.
--
-- This trigger refuses any non-admin attempt to change the `role` column.
-- An admin (verified via the same `current_user_is_admin()` helper) can
-- still update other users' roles — the future Wave 6 admin portal
-- depends on that path. Backend service-role contexts have no
-- `auth.uid()` and are also permitted (the `auth.uid() = new.id` guard
-- only fires when the caller is the row's owner).
create or replace function public.guard_role_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.role is distinct from new.role then
    if auth.uid() = new.id and not public.current_user_is_admin() then
      raise exception 'role can only be changed by an admin'
        using errcode = '42501'; -- insufficient_privilege
    end if;
  end if;
  return new;
end;
$$;

create trigger users_guard_role
  before update of role on public.users
  for each row execute function public.guard_role_update();

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
