-- Performance indexes for queue-heavy show pages and analytics counts.

create index if not exists queue_items_band_event_position_idx
  on public.queue_items (band_id, event_id, position, created_at);

create index if not exists queue_items_status_idx
  on public.queue_items (status);

create index if not exists events_band_active_created_idx
  on public.events (band_id, is_active, created_at desc);
