-- StageSync song source mode

ALTER TABLE show_settings
  ADD COLUMN IF NOT EXISTS song_source_mode TEXT NOT NULL DEFAULT 'uploaded';

ALTER TABLE show_settings
  DROP CONSTRAINT IF EXISTS show_settings_song_source_mode_check;

ALTER TABLE show_settings
  ADD CONSTRAINT show_settings_song_source_mode_check
  CHECK (song_source_mode IN ('uploaded', 'tidal_playlist', 'tidal_catalog'));

