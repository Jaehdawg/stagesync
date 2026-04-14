create extension if not exists pg_trgm;

create index if not exists songs_band_id_source_type_idx
  on public.songs (band_id, source_type);

create index if not exists songs_title_trgm_idx
  on public.songs using gin (title gin_trgm_ops);

create index if not exists songs_artist_trgm_idx
  on public.songs using gin (artist gin_trgm_ops);
