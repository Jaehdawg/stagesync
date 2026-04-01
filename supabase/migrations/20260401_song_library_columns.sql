-- Song library metadata for imports and archival

ALTER TABLE songs
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'uploaded',
  ADD COLUMN IF NOT EXISTS source_ref TEXT,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

UPDATE songs
SET source_type = COALESCE(source_type, 'uploaded')
WHERE source_type IS NULL;

ALTER TABLE songs
  ALTER COLUMN source_type SET DEFAULT 'uploaded';

ALTER TABLE songs
  ADD CONSTRAINT songs_source_type_check
    CHECK (source_type IN ('uploaded', 'google_sheet', 'tidal_playlist', 'manual'));

CREATE INDEX IF NOT EXISTS songs_archived_at_idx ON songs (archived_at);
CREATE INDEX IF NOT EXISTS songs_source_type_idx ON songs (source_type);
