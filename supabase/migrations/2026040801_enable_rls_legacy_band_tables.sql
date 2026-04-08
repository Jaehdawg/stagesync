-- Re-enable RLS for legacy band set-list/source tables.
-- These tables are accessed through service-role server code only.

alter table public.band_set_lists enable row level security;
alter table public.band_set_list_songs enable row level security;
alter table public.show_song_sources enable row level security;
