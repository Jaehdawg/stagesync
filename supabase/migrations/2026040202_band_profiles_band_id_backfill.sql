-- Backfill live band profile tenant ids from the canonical bands table.
--
-- This keeps the singer page and band page on the same live band row.
-- Any band profile rows whose band doesn't exist yet will create a matching
-- band row first, then attach band_profiles.band_id.

insert into public.bands (id, band_name)
select gen_random_uuid(), bp.band_name
from public.band_profiles bp
where btrim(bp.band_name) <> ''
  and not exists (
    select 1
    from public.bands b
    where lower(b.band_name) = lower(btrim(bp.band_name))
  );

with band_lookup as (
  select id, band_name
  from public.bands
)
update public.band_profiles bp
set band_id = bl.id
from band_lookup bl
where bp.band_id is null
  and lower(bl.band_name) = lower(btrim(bp.band_name));

alter table public.band_profiles alter column band_id set not null;
