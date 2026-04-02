-- Queue items should attach to the active test show, not the legacy events table.

alter table public.queue_items
  drop constraint if exists queue_items_event_id_fkey;

alter table public.queue_items
  add constraint queue_items_event_id_fkey
  foreign key (event_id)
  references public.test_shows (id)
  on delete cascade;
