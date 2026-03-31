-- StageSync Phase 1 Expansion
-- Extend the initial schema to support the MVP requirements.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'singer',
  ADD COLUMN IF NOT EXISTS bio TEXT;

CREATE TABLE IF NOT EXISTS band_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  band_name TEXT NOT NULL,
  logo_url TEXT,
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

CREATE TABLE IF NOT EXISTS show_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  playlist_only BOOLEAN NOT NULL DEFAULT false,
  lyrics_enabled BOOLEAN NOT NULL DEFAULT true,
  allow_tips BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS singer_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_item_id UUID REFERENCES queue_items(id) ON DELETE CASCADE,
  singer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE band_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE show_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE singer_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Band profiles are publicly viewable" ON band_profiles;
CREATE POLICY "Band profiles are publicly viewable" ON band_profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Hosts manage their band profile" ON band_profiles;
CREATE POLICY "Hosts manage their band profile" ON band_profiles
  FOR ALL USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Show settings are viewable for active hosts" ON show_settings;
CREATE POLICY "Show settings are viewable for active hosts" ON show_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Hosts manage show settings" ON show_settings;
CREATE POLICY "Hosts manage show settings" ON show_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = show_settings.event_id
        AND events.host_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Sing messages are readable by hosts" ON singer_messages;
CREATE POLICY "Sing messages are readable by hosts" ON singer_messages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Singers can create messages" ON singer_messages;
CREATE POLICY "Singers can create messages" ON singer_messages
  FOR INSERT WITH CHECK (auth.uid() = singer_id);
