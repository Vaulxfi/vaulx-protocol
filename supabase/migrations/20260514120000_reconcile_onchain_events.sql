-- Reconcile public.onchain_events to the canonical shape used by Laravel
-- (site/database/migrations/2026_04_23_000002 + 2026_05_04_000001) and by the
-- Next route handlers under apps/web/src/app/api/**.
--
-- Divergences resolved here (see docs/plans/2026-05-14-wave0-schema-recon-spec.md):
--   * PK: keep uuid (was uuid in Supabase already; spec target = uuid).
--   * Drop single-column UNIQUE on signature; add composite UNIQUE on
--     (signature, event_name). One Solana tx can emit multiple distinct
--     events (e.g. CcbTrdcCreated + TrdcStateInitialized) sharing a signature.
--   * Add occurred_at timestamptz NOT NULL (the event-time timestamp Laravel
--     writes). Keep created_at as audit-arrival (when row landed in Supabase).
--   * payload: nullable.
--   * slot: nullable.
--   * signature: NOT NULL.
--
-- Idempotent where possible. Wrapped in a single transaction.

begin;

-- Drop the legacy single-column UNIQUE on signature, however it was named.
do $$
declare
  cons record;
begin
  for cons in
    select conname
    from pg_constraint
    where conrelid = 'public.onchain_events'::regclass
      and contype = 'u'
      and array_length(conkey, 1) = 1
      and conkey[1] = (
        select attnum
        from pg_attribute
        where attrelid = 'public.onchain_events'::regclass
          and attname = 'signature'
      )
  loop
    execute format('alter table public.onchain_events drop constraint %I', cons.conname);
  end loop;
end$$;

-- Also drop any auto-created unique index on signature alone (in case it was
-- created as a plain unique index, not a constraint).
do $$
declare
  idx record;
begin
  for idx in
    select c.relname as indexname
    from pg_index i
    join pg_class c on c.oid = i.indexrelid
    join pg_class t on t.oid = i.indrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'onchain_events'
      and i.indisunique
      and array_length(i.indkey::int[], 1) = 1
      and (
        select attname
        from pg_attribute
        where attrelid = t.oid and attnum = i.indkey[0]
      ) = 'signature'
      and not i.indisprimary
  loop
    execute format('drop index if exists public.%I', idx.indexname);
  end loop;
end$$;

-- Add occurred_at if missing, backfill from created_at for existing rows.
alter table public.onchain_events
  add column if not exists occurred_at timestamptz;

update public.onchain_events
  set occurred_at = coalesce(occurred_at, created_at, now())
  where occurred_at is null;

alter table public.onchain_events
  alter column occurred_at set not null;

alter table public.onchain_events
  alter column occurred_at set default now();

-- Nullability fixes.
alter table public.onchain_events
  alter column payload drop not null;

alter table public.onchain_events
  alter column slot drop not null;

-- signature: ensure NOT NULL. If any legacy row has a null signature, leave
-- the migration failing loudly so the operator notices the data issue.
alter table public.onchain_events
  alter column signature set not null;

-- Composite UNIQUE (signature, event_name). Idempotent via constraint name.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.onchain_events'::regclass
      and conname = 'onchain_events_sig_evt_unique'
  ) then
    alter table public.onchain_events
      add constraint onchain_events_sig_evt_unique
      unique (signature, event_name);
  end if;
end$$;

-- Align indexes to the Laravel set + what Next queries by.
--   Laravel indexes: event_name, slot, occurred_at.
--   Next queries: order by created_at desc (legacy) → occurred_at desc,
--                 order by slot desc.
create index if not exists onchain_events_event_name_idx
  on public.onchain_events (event_name);

create index if not exists onchain_events_slot_idx
  on public.onchain_events (slot);

create index if not exists onchain_events_occurred_at_idx
  on public.onchain_events (occurred_at desc);

-- The legacy created_at-desc index is no longer used by any handler. Drop to
-- avoid write-amplification on a hot insert path; created_at is still kept as
-- the audit timestamp.
drop index if exists public.onchain_events_created_at_idx;

commit;
