-- Monetization foundation: account-level billing, entitlements, and credit tracking.
-- Provider-agnostic, UI-free, and safe to add before checkout/subscription wiring.

create table if not exists public.billing_accounts (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null unique references public.bands(id) on delete cascade,
  status text not null default 'free' check (status in ('free', 'active', 'grace', 'past_due', 'suspended')),
  free_shows_allocated integer not null default 3 check (free_shows_allocated >= 0),
  free_shows_used integer not null default 0 check (free_shows_used >= 0),
  payment_provider text,
  payment_customer_id text,
  payment_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  billing_account_id uuid not null references public.billing_accounts(id) on delete cascade,
  band_id uuid not null references public.bands(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  entry_type text not null check (
    entry_type in (
      'free_show_allocation',
      'credit_purchase',
      'credit_consumed',
      'undo_grace_hold',
      'subscription_grant',
      'subscription_revocation'
    )
  ),
  amount integer not null default 0,
  provider text,
  provider_reference text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.billing_show_windows (
  id uuid primary key default gen_random_uuid(),
  billing_account_id uuid not null references public.billing_accounts(id) on delete cascade,
  band_id uuid not null references public.bands(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  started_at timestamptz not null,
  expires_at timestamptz not null,
  undo_grace_until timestamptz,
  consumed_credit_at timestamptz,
  consumed_credit_ledger_id uuid references public.billing_credit_ledger(id) on delete set null,
  restart_count integer not null default 0 check (restart_count >= 0),
  is_paid_window boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id)
);

create index if not exists billing_accounts_band_id_idx on public.billing_accounts (band_id);
create index if not exists billing_credit_ledger_band_id_idx on public.billing_credit_ledger (band_id, created_at desc);
create index if not exists billing_credit_ledger_account_id_idx on public.billing_credit_ledger (billing_account_id, created_at desc);
create index if not exists billing_show_windows_band_id_idx on public.billing_show_windows (band_id, started_at desc);
create index if not exists billing_show_windows_account_id_idx on public.billing_show_windows (billing_account_id, started_at desc);

alter table public.billing_accounts enable row level security;
alter table public.billing_credit_ledger enable row level security;
alter table public.billing_show_windows enable row level security;
