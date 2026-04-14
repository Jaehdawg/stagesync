create index if not exists queue_items_event_band_status_created_at_idx
  on public.queue_items (event_id, band_id, status, created_at desc);

create index if not exists queue_items_event_band_status_position_idx
  on public.queue_items (event_id, band_id, status, position desc);

create index if not exists queue_items_band_event_performer_status_created_at_idx
  on public.queue_items (band_id, event_id, performer_id, status, created_at desc);

create index if not exists events_band_active_created_at_idx
  on public.events (band_id, is_active, created_at desc);

create index if not exists profiles_role_idx
  on public.profiles (role);

create index if not exists analytics_daily_rollups_rollup_date_band_metric_idx
  on public.analytics_daily_rollups (rollup_date desc, band_id, metric_key);
