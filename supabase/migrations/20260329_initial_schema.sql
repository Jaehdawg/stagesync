-- StageSync Initial Schema

-- 1. Profiles (for Users/Performers)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Events (Karaoke Sessions)
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  allow_signups BOOLEAN DEFAULT true,
  ended_at TIMESTAMP WITH TIME ZONE,
  access_code TEXT UNIQUE, -- Simple code for joiners
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Songs (Cached from Tidal or local catalog)
CREATE TABLE songs (
  id TEXT PRIMARY KEY, -- Using Tidal ID or internal ID
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album_art_url TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Queue (The actual rotation)
CREATE TABLE queue_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  performer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  song_id TEXT REFERENCES songs(id) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, singing, completed, cancelled
  position SERIAL, -- For sorting
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_items ENABLE ROW LEVEL SECURITY;

-- Simple Policies (to be refined)
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Anyone can view active events" ON events FOR SELECT USING (is_active = true);
CREATE POLICY "Hosts can manage their events" ON events FOR ALL USING (auth.uid() = host_id);
