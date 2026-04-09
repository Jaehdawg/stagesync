-- Venue provisioning status trail for manual handoff milestones.

create table if not exists public.venue_provisioning_events (
  id uuid primary key default gen_random_uuid(),
  venue_provisioning_draft_id uuid not null references public.venue_provisioning_drafts(id) on delete cascade,
  venue_lead_id uuid not null references public.venue_leads(id) on delete cascade,
  milestone text not null check (milestone in ('drafted', 'terms_reviewed', 'pricing_approved', 'activated')),
  note text,
  created_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists venue_provisioning_events_draft_created_at_idx on public.venue_provisioning_events (venue_provisioning_draft_id, created_at desc);
create index if not exists venue_provisioning_events_lead_created_at_idx on public.venue_provisioning_events (venue_lead_id, created_at desc);

alter table public.venue_provisioning_events enable row level security;
