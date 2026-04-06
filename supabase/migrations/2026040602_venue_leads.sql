-- Venue inbound lead capture and qualification.

create table if not exists public.venue_leads (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  city text,
  rooms_count integer not null check (rooms_count >= 0),
  bands_count integer,
  interest_level text not null check (interest_level in ('explore', 'demo', 'pricing', 'ready')),
  message text,
  follow_up_queue text not null default 'venue-sales-nurture',
  status text not null default 'new' check (status in ('new', 'reviewing', 'contacted', 'qualified', 'closed')),
  source text not null default 'request-demo',
  operator_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists venue_leads_status_created_at_idx on public.venue_leads (status, created_at desc);
create index if not exists venue_leads_follow_up_queue_idx on public.venue_leads (follow_up_queue, created_at desc);
create index if not exists venue_leads_email_idx on public.venue_leads (email);

alter table public.venue_leads enable row level security;
