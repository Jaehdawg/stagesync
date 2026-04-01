-- Multi-tenant band isolation.
-- Canonical tenant key: band_id (UUID).

create extension if not exists pgcrypto;

create table if not exists public.bands (
  id uuid primary key default gen_random_uuid(),
  band_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.band_memberships (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands(id) on delete cascade,
  member_type text not null check (member_type in ('profile', 'test_login')),
  member_key text not null,
  band_access_level text not null default 'member' check (band_access_level in ('admin', 'member')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (band_id, member_type, member_key)
);

alter table public.profiles add column if not exists active_band_id uuid references public.bands(id) on delete set null;
alter table public.test_logins add column if not exists active_band_id uuid references public.bands(id) on delete set null;

alter table public.band_profiles add column if not exists band_id uuid references public.bands(id) on delete set null;
alter table public.test_band_profiles add column if not exists band_id uuid references public.bands(id) on delete set null;
alter table public.events add column if not exists band_id uuid references public.bands(id) on delete set null;
alter table public.queue_items add column if not exists band_id uuid references public.bands(id) on delete set null;
alter table public.songs add column if not exists band_id uuid references public.bands(id) on delete set null;
alter table public.show_settings add column if not exists band_id uuid references public.bands(id) on delete set null;
alter table public.singer_messages add column if not exists band_id uuid references public.bands(id) on delete set null;
alter table public.song_import_jobs add column if not exists band_id uuid references public.bands(id) on delete set null;

with band_names as (
  select distinct btrim(name) as band_name
  from (
    select band_name as name from public.test_logins where band_name is not null and btrim(band_name) <> ''
    union all
    select band_name as name from public.test_band_profiles where band_name is not null and btrim(band_name) <> ''
    union all
    select band_name as name from public.band_profiles where band_name is not null and btrim(band_name) <> ''
    union all
    select 'Finding North' as name
  ) names
)
insert into public.bands (id, band_name)
select gen_random_uuid(), band_name
from band_names
where not exists (
  select 1
  from public.bands existing
  where lower(existing.band_name) = lower(band_names.band_name)
);

with finding_north as (
  select id
  from public.bands
  where lower(band_name) = lower('Finding North')
  order by created_at asc
  limit 1
)
update public.band_profiles
set band_id = coalesce(band_id, (select id from finding_north))
where band_id is null;

with band_lookup as (
  select id, band_name
  from public.bands
)
update public.test_band_profiles tbp
set band_id = bl.id
from band_lookup bl
where tbp.band_id is null
  and tbp.band_name is not null
  and btrim(tbp.band_name) <> ''
  and lower(bl.band_name) = lower(btrim(tbp.band_name));

with band_lookup as (
  select id, band_name
  from public.bands
)
update public.test_logins tl
set active_band_id = bl.id
from band_lookup bl
where tl.active_band_id is null
  and tl.band_name is not null
  and btrim(tl.band_name) <> ''
  and lower(bl.band_name) = lower(btrim(tl.band_name));

with finding_north as (
  select id
  from public.bands
  where lower(band_name) = lower('Finding North')
  order by created_at asc
  limit 1
)
update public.events set band_id = coalesce(band_id, (select id from finding_north)) where band_id is null;

with finding_north as (
  select id
  from public.bands
  where lower(band_name) = lower('Finding North')
  order by created_at asc
  limit 1
)
update public.queue_items set band_id = coalesce(band_id, (select id from finding_north)) where band_id is null;

with finding_north as (
  select id
  from public.bands
  where lower(band_name) = lower('Finding North')
  order by created_at asc
  limit 1
)
update public.songs set band_id = coalesce(band_id, (select id from finding_north)) where band_id is null;

with finding_north as (
  select id
  from public.bands
  where lower(band_name) = lower('Finding North')
  order by created_at asc
  limit 1
)
update public.show_settings set band_id = coalesce(band_id, (select id from finding_north)) where band_id is null;

with finding_north as (
  select id
  from public.bands
  where lower(band_name) = lower('Finding North')
  order by created_at asc
  limit 1
)
update public.singer_messages set band_id = coalesce(band_id, (select id from finding_north)) where band_id is null;

with finding_north as (
  select id
  from public.bands
  where lower(band_name) = lower('Finding North')
  order by created_at asc
  limit 1
)
update public.song_import_jobs set band_id = coalesce(band_id, (select id from finding_north)) where band_id is null;

with finding_north as (
  select id
  from public.bands
  where lower(band_name) = lower('Finding North')
  order by created_at asc
  limit 1
)
update public.profiles set active_band_id = coalesce(active_band_id, (select id from finding_north)) where active_band_id is null;

insert into public.band_memberships (band_id, member_type, member_key, band_access_level)
select distinct tl.active_band_id, 'test_login', tl.username, coalesce(tl.band_access_level, case when tl.role = 'band' then 'admin' else 'member' end)
from public.test_logins tl
where tl.active_band_id is not null
  and not exists (
    select 1
    from public.band_memberships bm
    where bm.band_id = tl.active_band_id
      and bm.member_type = 'test_login'
      and bm.member_key = tl.username
  );

alter table public.band_profiles alter column band_id set not null;
alter table public.test_band_profiles alter column band_id set not null;
alter table public.events alter column band_id set not null;
alter table public.queue_items alter column band_id set not null;
alter table public.songs alter column band_id set not null;
alter table public.show_settings alter column band_id set not null;
alter table public.singer_messages alter column band_id set not null;
alter table public.song_import_jobs alter column band_id set not null;

alter table public.queue_items drop constraint if exists queue_items_song_id_fkey;
alter table public.songs drop constraint if exists songs_pkey;
alter table public.songs add constraint songs_pkey primary key (band_id, id);
alter table public.queue_items
  add constraint queue_items_song_id_fkey
  foreign key (band_id, song_id)
  references public.songs (band_id, id)
  on delete cascade;

create index if not exists idx_band_memberships_member on public.band_memberships (member_type, member_key, band_id);
create index if not exists idx_band_memberships_band on public.band_memberships (band_id);
create index if not exists idx_events_band_id on public.events (band_id);
create index if not exists idx_queue_items_band_id on public.queue_items (band_id);
create index if not exists idx_songs_band_id on public.songs (band_id);
create index if not exists idx_show_settings_band_id on public.show_settings (band_id);
create index if not exists idx_singer_messages_band_id on public.singer_messages (band_id);
create index if not exists idx_song_import_jobs_band_id on public.song_import_jobs (band_id);
