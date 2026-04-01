-- New testing show model used by the band dashboard.

create table if not exists public.test_shows (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands(id) on delete cascade,
  band_name text,
  host_id uuid references public.profiles(id) on delete set null,
  name text not null default 'StageSync Show',
  description text,
  is_active boolean not null default false,
  allow_signups boolean not null default true,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.test_show_settings (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands(id) on delete cascade,
  event_id uuid references public.test_shows(id) on delete cascade,
  playlist_only boolean not null default false,
  lyrics_enabled boolean not null default true,
  allow_tips boolean not null default true,
  signup_buffer_minutes integer not null default 1,
  show_duration_minutes integer not null default 60,
  song_source_mode text not null default 'uploaded' check (song_source_mode in ('uploaded', 'tidal_playlist', 'tidal_catalog')),
  tidal_playlist_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (band_id)
);

create index if not exists idx_test_shows_band_id on public.test_shows (band_id);
create index if not exists idx_test_shows_created_at on public.test_shows (created_at);
create index if not exists idx_test_show_settings_band_id on public.test_show_settings (band_id);
create index if not exists idx_test_show_settings_event_id on public.test_show_settings (event_id);

grant select, insert, update, delete on public.test_shows to anon, authenticated, service_role;
grant select, insert, update, delete on public.test_show_settings to anon, authenticated, service_role;
