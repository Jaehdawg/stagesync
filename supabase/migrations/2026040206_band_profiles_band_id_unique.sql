-- Allow live band profiles to upsert by band_id.

CREATE UNIQUE INDEX IF NOT EXISTS band_profiles_band_id_unique_idx
  ON public.band_profiles (band_id);
