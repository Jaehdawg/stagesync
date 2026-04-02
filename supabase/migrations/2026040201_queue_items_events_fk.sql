-- Restore the live queue_items foreign key to events.
--
-- The app now uses the live singer/band flow against events/show_settings.
-- We keep the new FK NOT VALID so deploys don't fail if legacy test-mode rows
-- still exist; new inserts will use events immediately.

alter table public.queue_items
  drop constraint if exists queue_items_event_id_fkey;

alter table public.queue_items
  add constraint queue_items_event_id_fkey
  foreign key (event_id)
  references public.events (id)
  on delete cascade
  not valid;
