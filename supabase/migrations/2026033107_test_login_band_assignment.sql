-- Add band assignment support to testing-only logins.

ALTER TABLE test_logins
  ADD COLUMN IF NOT EXISTS band_name TEXT;

CREATE OR REPLACE FUNCTION test_upsert_login(
  p_username TEXT,
  p_role TEXT,
  p_password_hash TEXT,
  p_band_name TEXT DEFAULT NULL
)
RETURNS test_logins
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_login test_logins;
BEGIN
  INSERT INTO test_logins (username, role, password_hash, band_name)
  VALUES (
    LOWER(BTRIM(p_username)),
    p_role,
    p_password_hash,
    NULLIF(BTRIM(COALESCE(p_band_name, '')), '')
  )
  ON CONFLICT (username) DO UPDATE SET
    role = EXCLUDED.role,
    password_hash = EXCLUDED.password_hash,
    band_name = EXCLUDED.band_name
  RETURNING * INTO updated_login;

  RETURN updated_login;
END;
$$;
