-- StageSync Tidal playlist pointer

ALTER TABLE show_settings
  ADD COLUMN IF NOT EXISTS tidal_playlist_url TEXT;

