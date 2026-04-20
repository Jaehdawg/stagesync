-- Store a manual singer label on queue items so band admins can queue
-- a singer/song pair without linking it to a singer user profile.

alter table public.queue_items
  add column if not exists singer_name text;
