-- Store band-level Tidal API credentials for show-level Tidal Catalog mode.

ALTER TABLE public.band_profiles
  ADD COLUMN IF NOT EXISTS tidal_client_id text,
  ADD COLUMN IF NOT EXISTS tidal_client_secret text;

ALTER TABLE public.test_band_profiles
  ADD COLUMN IF NOT EXISTS tidal_client_id text,
  ADD COLUMN IF NOT EXISTS tidal_client_secret text;
