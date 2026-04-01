-- Background job tracking for long-running song imports.

CREATE TABLE IF NOT EXISTS song_import_jobs (
  id UUID PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_url TEXT,
  source_ref TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  total_items INTEGER NOT NULL DEFAULT 0,
  processed_items INTEGER NOT NULL DEFAULT 0,
  imported_items INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

ALTER TABLE song_import_jobs ENABLE ROW LEVEL SECURITY;
