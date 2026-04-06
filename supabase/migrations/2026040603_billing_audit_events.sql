-- Billing audit/event log for canonical billing and entitlement changes.

create table if not exists public.billing_audit_events (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands(id) on delete cascade,
  billing_account_id uuid references public.billing_accounts(id) on delete set null,
  actor_role text not null default 'system' check (actor_role in ('admin', 'band', 'singer', 'system')),
  actor_user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  entity_type text,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists billing_audit_events_band_id_occurred_at_idx on public.billing_audit_events (band_id, occurred_at desc);
create index if not exists billing_audit_events_event_name_occurred_at_idx on public.billing_audit_events (event_name, occurred_at desc);
create index if not exists billing_audit_events_account_id_occurred_at_idx on public.billing_audit_events (billing_account_id, occurred_at desc);

alter table public.billing_audit_events enable row level security;
