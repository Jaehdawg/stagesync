-- Distinguish band admins from band members in testing logins.

ALTER TABLE test_logins
  ADD COLUMN IF NOT EXISTS band_access_level TEXT;

ALTER TABLE test_logins
  DROP CONSTRAINT IF EXISTS test_logins_band_access_level_check;

ALTER TABLE test_logins
  ADD CONSTRAINT test_logins_band_access_level_check
  CHECK (band_access_level IN ('admin', 'member') OR band_access_level IS NULL);

UPDATE test_logins
SET band_access_level = COALESCE(band_access_level, 'admin')
WHERE role = 'band';
