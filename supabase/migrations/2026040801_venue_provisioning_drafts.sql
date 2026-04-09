-- Venue provisioning draft records for the manual venue sales handoff.

create table if not exists public.venue_provisioning_drafts (
  id uuid primary key default gen_random_uuid(),
  venue_lead_id uuid not null unique references public.venue_leads(id) on delete cascade,
  company_name text not null,
  contact_name text not null,
  status text not null default 'draft' check (status in ('draft', 'review', 'active', 'archived')),
  follow_up_queue text not null default 'venue-sales-hot',
  operator_notes text,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists venue_provisioning_drafts_status_created_at_idx on public.venue_provisioning_drafts (status, created_at desc);
create index if not exists venue_provisioning_drafts_lead_id_idx on public.venue_provisioning_drafts (venue_lead_id);

alter table public.venue_provisioning_drafts enable row level security;
