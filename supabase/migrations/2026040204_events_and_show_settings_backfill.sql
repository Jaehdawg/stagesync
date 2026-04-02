-- Backfill live show tables from the existing test-show records.
--
-- This copies the actual show payload into public.events and public.show_settings
-- so the singer page and queue can use the live tables the app now targets.

with fallback_host as (
  select id as profile_id
  from public.profiles
  where username = 'test'
  limit 1
),
source_shows as (
  select
    ts.id,
    coalesce(ts.host_id, fallback_host.profile_id) as host_id,
    ts.band_id,
    ts.name,
    ts.description,
    ts.is_active,
    ts.allow_signups,
    ts.ended_at,
    ts.created_at
  from public.test_shows ts
  cross join fallback_host
)
insert into public.events (id, host_id, band_id, name, description, is_active, allow_signups, ended_at, created_at)
select
  id,
  host_id,
  band_id,
  name,
  description,
  is_active,
  allow_signups,
  ended_at,
  created_at
from source_shows
on conflict (id) do update
set
  host_id = excluded.host_id,
  band_id = excluded.band_id,
  name = excluded.name,
  description = excluded.description,
  is_active = excluded.is_active,
  allow_signups = excluded.allow_signups,
  ended_at = excluded.ended_at;

insert into public.show_settings (
  event_id,
  band_id,
  playlist_only,
  lyrics_enabled,
  allow_tips,
  signup_buffer_minutes,
  show_duration_minutes,
  song_source_mode,
  tidal_playlist_url,
  created_at
)
select
  tss.event_id,
  tss.band_id,
  tss.playlist_only,
  tss.lyrics_enabled,
  tss.allow_tips,
  tss.signup_buffer_minutes,
  tss.show_duration_minutes,
  tss.song_source_mode,
  tss.tidal_playlist_url,
  tss.created_at
from public.test_show_settings tss
on conflict (event_id) do update
set
  band_id = excluded.band_id,
  playlist_only = excluded.playlist_only,
  lyrics_enabled = excluded.lyrics_enabled,
  allow_tips = excluded.allow_tips,
  signup_buffer_minutes = excluded.signup_buffer_minutes,
  show_duration_minutes = excluded.show_duration_minutes,
  song_source_mode = excluded.song_source_mode,
  tidal_playlist_url = excluded.tidal_playlist_url;
