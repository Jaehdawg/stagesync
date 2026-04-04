-- Allow Tidal catalog songs to be tracked as song-library entries.
-- This keeps catalog selections compatible with the existing per-show queue path.

alter table public.songs
  drop constraint if exists songs_source_type_check;

alter table public.songs
  add constraint songs_source_type_check
    check (source_type in ('uploaded', 'google_sheet', 'tidal_playlist', 'tidal_catalog', 'manual'));
