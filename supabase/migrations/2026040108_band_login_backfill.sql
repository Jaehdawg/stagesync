-- Backfill band login associations so existing band accounts resolve an active band.

insert into public.bands (id, band_name)
select gen_random_uuid(), btrim(tl.band_name)
from public.test_logins tl
where tl.role = 'band'
  and tl.band_name is not null
  and btrim(tl.band_name) <> ''
  and not exists (
    select 1
    from public.bands b
    where lower(b.band_name) = lower(btrim(tl.band_name))
  );

with band_lookup as (
  select id, band_name
  from public.bands
)
update public.test_logins tl
set active_band_id = bl.id
from band_lookup bl
where tl.role = 'band'
  and tl.active_band_id is null
  and tl.band_name is not null
  and btrim(tl.band_name) <> ''
  and lower(bl.band_name) = lower(btrim(tl.band_name));

insert into public.band_memberships (band_id, member_type, member_key, band_access_level)
select distinct tl.active_band_id, 'test_login', lower(tl.username), coalesce(tl.band_access_level, 'admin')
from public.test_logins tl
where tl.role = 'band'
  and tl.active_band_id is not null
  and not exists (
    select 1
    from public.band_memberships bm
    where bm.band_id = tl.active_band_id
      and bm.member_type = 'test_login'
      and bm.member_key = lower(tl.username)
  );
