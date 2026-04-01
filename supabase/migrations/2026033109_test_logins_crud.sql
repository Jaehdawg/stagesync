-- Testing-only CRUD helpers for StageSync login accounts.

CREATE OR REPLACE FUNCTION test_list_logins()
RETURNS SETOF test_logins
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM test_logins
  ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION test_upsert_login(
  p_username TEXT,
  p_role TEXT,
  p_password_hash TEXT
)
RETURNS test_logins
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_login test_logins;
BEGIN
  INSERT INTO test_logins (username, role, password_hash)
  VALUES (
    LOWER(BTRIM(p_username)),
    p_role,
    p_password_hash
  )
  ON CONFLICT (username) DO UPDATE SET
    role = EXCLUDED.role,
    password_hash = EXCLUDED.password_hash
  RETURNING * INTO updated_login;

  RETURN updated_login;
END;
$$;

CREATE OR REPLACE FUNCTION test_delete_login(p_username TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM test_logins WHERE username = LOWER(BTRIM(p_username));
$$;
