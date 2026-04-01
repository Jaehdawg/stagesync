-- Testing-only seeded logins for StageSync on Vercel.
-- These are not production auth users; they back the test login flow.

CREATE TABLE IF NOT EXISTS test_logins (
  username TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('band', 'admin')),
  password_hash TEXT NOT NULL,
  band_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO test_logins (username, role, password_hash, band_name)
VALUES
  ('neon-echo-band', 'band', 'f2ea211322b9659fa7bc9f1bdb4a710f6723abca6e0a8b9fc23adad0bee4bfe9', 'Neon Echo'),
  ('stagesync-admin', 'admin', '85deb727695af8f0ca54b6a2178efe944fc7ff521f9d8daa10445eaae571cb2c', NULL)
ON CONFLICT (username) DO UPDATE SET
  role = EXCLUDED.role,
  password_hash = EXCLUDED.password_hash,
  band_name = EXCLUDED.band_name;
