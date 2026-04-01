-- Allow test band profiles to upsert by band_id.

CREATE UNIQUE INDEX IF NOT EXISTS test_band_profiles_band_id_unique_idx
  ON public.test_band_profiles (band_id);
