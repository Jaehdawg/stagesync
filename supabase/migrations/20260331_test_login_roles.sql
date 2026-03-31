-- Expand testing login roles to include singers for admin CRUD coverage.

ALTER TABLE test_logins
  DROP CONSTRAINT IF EXISTS test_logins_role_check;

ALTER TABLE test_logins
  ADD CONSTRAINT test_logins_role_check
  CHECK (role IN ('singer', 'band', 'admin'));
