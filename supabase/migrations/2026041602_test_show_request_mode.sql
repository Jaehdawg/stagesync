CREATE OR REPLACE FUNCTION test_create_show(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_request_mode_enabled BOOLEAN DEFAULT false,
  p_request_source_mode TEXT DEFAULT 'set_list'
)
RETURNS events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_event events;
BEGIN
  INSERT INTO events (
    host_id,
    name,
    description,
    is_active,
    allow_signups,
    access_code
  )
  VALUES (
    NULL,
    COALESCE(NULLIF(BTRIM(p_name), ''), 'StageSync Show'),
    NULLIF(BTRIM(p_description), ''),
    true,
    true,
    REPLACE(gen_random_uuid()::text, '-', '')
  )
  RETURNING * INTO new_event;

  INSERT INTO show_settings (
    event_id,
    playlist_only,
    lyrics_enabled,
    allow_tips,
    signup_buffer_minutes,
    show_duration_minutes,
    song_source_mode,
    request_mode_enabled,
    request_source_mode,
    tidal_playlist_url
  )
  VALUES (
    new_event.id,
    false,
    true,
    true,
    1,
    60,
    'uploaded',
    COALESCE(p_request_mode_enabled, false),
    COALESCE(NULLIF(BTRIM(p_request_source_mode), ''), 'set_list'),
    NULL
  )
  ON CONFLICT (event_id) DO UPDATE SET
    signup_buffer_minutes = EXCLUDED.signup_buffer_minutes,
    show_duration_minutes = EXCLUDED.show_duration_minutes,
    song_source_mode = EXCLUDED.song_source_mode,
    request_mode_enabled = EXCLUDED.request_mode_enabled,
    request_source_mode = EXCLUDED.request_source_mode,
    tidal_playlist_url = EXCLUDED.tidal_playlist_url,
    updated_at = NOW();

  RETURN new_event;
END;
$$;

CREATE OR REPLACE FUNCTION test_update_show_settings(
  p_event_id UUID,
  p_show_duration_minutes INTEGER,
  p_signup_buffer_minutes INTEGER,
  p_song_source_mode TEXT DEFAULT 'uploaded',
  p_request_mode_enabled BOOLEAN DEFAULT false,
  p_request_source_mode TEXT DEFAULT 'set_list',
  p_tidal_playlist_url TEXT DEFAULT NULL
)
RETURNS show_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_settings show_settings;
BEGIN
  INSERT INTO show_settings (
    event_id,
    playlist_only,
    lyrics_enabled,
    allow_tips,
    signup_buffer_minutes,
    show_duration_minutes,
    song_source_mode,
    request_mode_enabled,
    request_source_mode,
    tidal_playlist_url,
    updated_at
  )
  VALUES (
    COALESCE(p_event_id, (SELECT id FROM events ORDER BY created_at DESC LIMIT 1)),
    false,
    true,
    true,
    COALESCE(p_signup_buffer_minutes, 1),
    COALESCE(p_show_duration_minutes, 60),
    COALESCE(NULLIF(BTRIM(p_song_source_mode), ''), 'uploaded'),
    COALESCE(p_request_mode_enabled, false),
    COALESCE(NULLIF(BTRIM(p_request_source_mode), ''), 'set_list'),
    NULLIF(BTRIM(p_tidal_playlist_url), ''),
    NOW()
  )
  ON CONFLICT (event_id) DO UPDATE SET
    signup_buffer_minutes = EXCLUDED.signup_buffer_minutes,
    show_duration_minutes = EXCLUDED.show_duration_minutes,
    song_source_mode = EXCLUDED.song_source_mode,
    request_mode_enabled = EXCLUDED.request_mode_enabled,
    request_source_mode = EXCLUDED.request_source_mode,
    tidal_playlist_url = EXCLUDED.tidal_playlist_url,
    updated_at = NOW()
  RETURNING * INTO updated_settings;

  RETURN updated_settings;
END;
$$;
