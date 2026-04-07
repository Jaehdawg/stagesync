-- Venue lead review support: store negotiated commercial terms separately from freeform notes.

alter table public.venue_leads
  add column if not exists commercial_terms text;
