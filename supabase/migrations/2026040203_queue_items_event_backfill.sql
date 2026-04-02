-- Backfill existing queue items from legacy test shows onto live events.
--
-- This updates rows whose event_id still points at public.test_shows so the
-- restored queue_items -> events foreign key can be validated later.

with legacy_queue_rows as (
  select
    qi.id as queue_item_id,
    qi.band_id,
    ts.name as test_show_name
  from public.queue_items qi
  join public.test_shows ts
    on ts.id = qi.event_id
),
resolved_events as (
  select
    lqr.queue_item_id,
    lqr.band_id,
    coalesce(
      (
        select e.id
        from public.events e
        where e.band_id = lqr.band_id
          and lower(e.name) = lower(coalesce(lqr.test_show_name, ''))
        order by e.created_at desc
        limit 1
      ),
      (
        select e.id
        from public.events e
        where e.band_id = lqr.band_id
        order by e.created_at desc
        limit 1
      )
    ) as live_event_id
  from legacy_queue_rows lqr
)
update public.queue_items qi
set
  event_id = re.live_event_id,
  band_id = coalesce(qi.band_id, re.band_id)
from resolved_events re
where qi.id = re.queue_item_id
  and re.live_event_id is not null;
