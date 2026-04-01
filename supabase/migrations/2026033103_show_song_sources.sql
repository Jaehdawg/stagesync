-- StageSync show song source preferences

CREATE TABLE IF NOT EXISTS show_song_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  source_mode TEXT NOT NULL DEFAULT 'uploaded',
  tidal_playlist_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT show_song_sources_source_mode_check
    CHECK (source_mode IN ('uploaded', 'tidal_playlist', 'tidal_catalog'))
);

