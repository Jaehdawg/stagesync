-- Analytics reporting foundation: raw event capture and rollup storage.
-- Keep raw events append-only so dashboards, exports, and future funnels can be rebuilt.

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  band_id uuid references public.bands(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text not null default 'system' check (actor_role in ('admin', 'band', 'singer', 'guest', 'system')),
  event_name text not null,
  entity_type text,
  entity_id uuid,
  source text not null default 'app',
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_daily_rollups (
  id uuid primary key default gen_random_uuid(),
  rollup_date date not null,
  band_id uuid references public.bands(id) on delete cascade,
  metric_key text not null,
  metric_value numeric not null default 0,
  dimensions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (rollup_date, band_id, metric_key)
);

create index if not exists analytics_events_band_id_occurred_at_idx on public.analytics_events (band_id, occurred_at desc);
create index if not exists analytics_events_event_name_occurred_at_idx on public.analytics_events (event_name, occurred_at desc);
create index if not exists analytics_daily_rollups_band_id_date_idx on public.analytics_daily_rollups (band_id, rollup_date desc);

alter table public.analytics_events enable row level security;
alter table public.analytics_daily_rollups enable row level security;
