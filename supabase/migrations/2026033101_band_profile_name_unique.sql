-- Ensure band profile names are unique (case-insensitive).

CREATE UNIQUE INDEX IF NOT EXISTS band_profiles_band_name_unique_idx
  ON band_profiles (LOWER(band_name));
