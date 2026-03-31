-- Testing-only RPC helpers for StageSync show creation/state changes.
-- These bypass RLS via SECURITY DEFINER so the Vercel test login can manage shows
-- without a real Supabase auth user.

ALTER TABLE events
  ALTER COLUMN host_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION test_latest_show()
RETURNS SETOF events
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM events
  ORDER BY created_at DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION test_create_show(p_name TEXT, p_description TEXT DEFAULT NULL)
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

  RETURN new_event;
END;
$$;

CREATE OR REPLACE FUNCTION test_update_show_state(p_event_id UUID, p_action TEXT)
RETURNS events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id UUID;
  updated_event events;
BEGIN
  target_id := COALESCE(
    p_event_id,
    (SELECT id FROM events ORDER BY created_at DESC LIMIT 1)
  );

  IF target_id IS NULL THEN
    RAISE EXCEPTION 'No show available to update';
  END IF;

  CASE p_action
    WHEN 'start' THEN
      UPDATE events
      SET is_active = true,
          allow_signups = true,
          ended_at = NULL
      WHERE id = target_id
      RETURNING * INTO updated_event;
    WHEN 'pause' THEN
      UPDATE events
      SET is_active = true,
          allow_signups = false
      WHERE id = target_id
      RETURNING * INTO updated_event;
    WHEN 'resume' THEN
      UPDATE events
      SET is_active = true,
          allow_signups = true
      WHERE id = target_id
      RETURNING * INTO updated_event;
    WHEN 'end' THEN
      UPDATE events
      SET is_active = false,
          allow_signups = false,
          ended_at = NOW()
      WHERE id = target_id
      RETURNING * INTO updated_event;
    ELSE
      RAISE EXCEPTION 'Unknown show action: %', p_action;
  END CASE;

  RETURN updated_event;
END;
$$;
