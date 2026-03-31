-- Testing-only band profile storage for StageSync.

CREATE TABLE IF NOT EXISTS test_band_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_name TEXT NOT NULL DEFAULT 'StageSync',
  website_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  tiktok_url TEXT,
  paypal_url TEXT,
  venmo_url TEXT,
  cashapp_url TEXT,
  custom_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO test_band_profiles (
  band_name,
  website_url,
  facebook_url,
  instagram_url,
  tiktok_url,
  paypal_url,
  venmo_url,
  cashapp_url,
  custom_message
)
VALUES (
  'StageSync',
  'https://example.com',
  'https://facebook.com',
  'https://instagram.com',
  'https://tiktok.com',
  'https://paypal.com',
  'https://venmo.com',
  'https://cash.app',
  'Thanks for singing with us — tip the band and leave a note if you want.'
)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION test_latest_band_profile()
RETURNS SETOF test_band_profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM test_band_profiles
  ORDER BY created_at DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION test_update_band_profile(
  p_band_name TEXT,
  p_website_url TEXT,
  p_facebook_url TEXT,
  p_instagram_url TEXT,
  p_tiktok_url TEXT,
  p_paypal_url TEXT,
  p_venmo_url TEXT,
  p_cashapp_url TEXT,
  p_custom_message TEXT
)
RETURNS test_band_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_profile test_band_profiles;
  target_id UUID;
BEGIN
  SELECT id INTO target_id
  FROM test_band_profiles
  ORDER BY created_at DESC
  LIMIT 1;

  IF target_id IS NULL THEN
    INSERT INTO test_band_profiles (
      band_name,
      website_url,
      facebook_url,
      instagram_url,
      tiktok_url,
      paypal_url,
      venmo_url,
      cashapp_url,
      custom_message,
      updated_at
    ) VALUES (
      COALESCE(NULLIF(BTRIM(p_band_name), ''), 'StageSync'),
      NULLIF(BTRIM(p_website_url), ''),
      NULLIF(BTRIM(p_facebook_url), ''),
      NULLIF(BTRIM(p_instagram_url), ''),
      NULLIF(BTRIM(p_tiktok_url), ''),
      NULLIF(BTRIM(p_paypal_url), ''),
      NULLIF(BTRIM(p_venmo_url), ''),
      NULLIF(BTRIM(p_cashapp_url), ''),
      NULLIF(BTRIM(p_custom_message), ''),
      NOW()
    ) RETURNING * INTO updated_profile;

    RETURN updated_profile;
  END IF;

  UPDATE test_band_profiles
  SET
    band_name = COALESCE(NULLIF(BTRIM(p_band_name), ''), band_name),
    website_url = NULLIF(BTRIM(p_website_url), ''),
    facebook_url = NULLIF(BTRIM(p_facebook_url), ''),
    instagram_url = NULLIF(BTRIM(p_instagram_url), ''),
    tiktok_url = NULLIF(BTRIM(p_tiktok_url), ''),
    paypal_url = NULLIF(BTRIM(p_paypal_url), ''),
    venmo_url = NULLIF(BTRIM(p_venmo_url), ''),
    cashapp_url = NULLIF(BTRIM(p_cashapp_url), ''),
    custom_message = NULLIF(BTRIM(p_custom_message), ''),
    updated_at = NOW()
  WHERE id = target_id
  RETURNING * INTO updated_profile;

  RETURN updated_profile;
END;
$$;
