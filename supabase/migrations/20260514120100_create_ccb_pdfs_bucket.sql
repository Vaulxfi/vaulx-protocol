-- Provision the `ccb-pdfs` Supabase Storage bucket referenced by
-- apps/web/src/lib/chain/ccb-storage.ts. Private (no public read), with
-- server-only writes via the service role.
--
-- Supabase Storage stores bucket metadata in storage.buckets and object
-- metadata in storage.objects. RLS on storage.objects is enabled by default
-- on Supabase-managed projects; without any matching policy, only the
-- service-role key (which bypasses RLS) can read or write. We intentionally
-- create NO policies for this bucket — server-only access by design.

begin;

insert into storage.buckets (id, name, public)
values ('ccb-pdfs', 'ccb-pdfs', false)
on conflict (id) do update
  set public = excluded.public,
      name   = excluded.name;

-- Defensive: ensure RLS is on for storage.objects. Supabase enables this by
-- default; the statement is a no-op if already enabled.
alter table storage.objects enable row level security;

commit;
