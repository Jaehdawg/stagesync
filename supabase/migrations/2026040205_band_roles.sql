-- Live band roles for profile-backed users.
-- A single profile can belong to multiple bands with different access levels.

create table if not exists public.band_roles (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  band_role text not null check (band_role in ('admin', 'member')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (band_id, profile_id)
);

alter table public.band_roles enable row level security;

create policy "Band roles are publicly viewable" on public.band_roles
  for select using (true);

create policy "Band admins manage band roles" on public.band_roles
  for all using (
    exists (
      select 1
      from public.band_roles me
      where me.band_id = band_roles.band_id
        and me.profile_id = auth.uid()
        and me.band_role = 'admin'
        and me.active = true
    )
  );

create index if not exists idx_band_roles_band_id on public.band_roles (band_id);
create index if not exists idx_band_roles_profile_id on public.band_roles (profile_id);
create index if not exists idx_band_roles_band_profile on public.band_roles (band_id, profile_id);
