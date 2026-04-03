-- Band-scoped set lists.
-- A band can have many saved set lists but only one active list at a time.

create extension if not exists pgcrypto;

create table if not exists public.band_set_lists (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands(id) on delete cascade,
  name text not null,
  description text,
  notes text,
  is_active boolean not null default false,
  copied_from_set_list_id uuid references public.band_set_lists(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (band_id, id)
);

create table if not exists public.band_set_list_songs (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null,
  set_list_id uuid not null,
  song_id uuid not null,
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (set_list_id, position),
  unique (set_list_id, song_id),
  constraint band_set_list_songs_band_set_list_fkey
    foreign key (band_id, set_list_id)
    references public.band_set_lists (band_id, id)
    on delete cascade,
  constraint band_set_list_songs_song_fkey
    foreign key (band_id, song_id)
    references public.songs (band_id, id)
    on delete cascade
);

create index if not exists idx_band_set_lists_band_id on public.band_set_lists (band_id);
create index if not exists idx_band_set_lists_active on public.band_set_lists (band_id, is_active);
create unique index if not exists idx_band_set_lists_single_active on public.band_set_lists (band_id) where is_active;
create index if not exists idx_band_set_list_songs_band_id on public.band_set_list_songs (band_id);
create index if not exists idx_band_set_list_songs_set_list_id on public.band_set_list_songs (set_list_id, position);
create index if not exists idx_band_set_list_songs_song_id on public.band_set_list_songs (band_id, song_id);

grant select, insert, update, delete on public.band_set_lists to anon, authenticated, service_role;
grant select, insert, update, delete on public.band_set_list_songs to anon, authenticated, service_role;

alter table public.show_song_sources
  drop constraint if exists show_song_sources_source_mode_check;
alter table public.show_song_sources
  add constraint show_song_sources_source_mode_check
    check (source_mode in ('uploaded', 'tidal_playlist', 'tidal_catalog', 'set_list'));

alter table public.show_settings
  drop constraint if exists show_settings_song_source_mode_check;
alter table public.show_settings
  add constraint show_settings_song_source_mode_check
    check (song_source_mode in ('uploaded', 'tidal_playlist', 'tidal_catalog', 'set_list'));

alter table public.test_show_settings
  drop constraint if exists test_show_settings_song_source_mode_check;
alter table public.test_show_settings
  add constraint test_show_settings_song_source_mode_check
    check (song_source_mode in ('uploaded', 'tidal_playlist', 'tidal_catalog', 'set_list'));
