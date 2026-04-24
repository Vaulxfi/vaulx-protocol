create table if not exists public.onchain_events (
  id uuid primary key default gen_random_uuid(),
  program_id text not null,
  event_name text not null,
  payload jsonb not null,
  slot bigint not null,
  signature text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists onchain_events_event_name_idx on public.onchain_events (event_name);
create index if not exists onchain_events_created_at_idx on public.onchain_events (created_at desc);
