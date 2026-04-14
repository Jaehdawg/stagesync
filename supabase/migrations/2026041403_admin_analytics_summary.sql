create or replace function public.get_admin_analytics_summary()
returns table (
  band_count bigint,
  show_count bigint,
  active_show_count bigint,
  singer_count bigint,
  tracks_played_count bigint,
  recent_show_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    (select count(*)::bigint from public.bands) as band_count,
    (select count(*)::bigint from public.events) as show_count,
    (select count(*)::bigint from public.events where is_active = true) as active_show_count,
    (select count(*)::bigint from public.profiles where role = 'singer') as singer_count,
    (select count(*)::bigint from public.queue_items where status = 'completed') as tracks_played_count,
    (select count(*)::bigint from public.events where created_at >= now() - interval '30 days') as recent_show_count;
$$;
