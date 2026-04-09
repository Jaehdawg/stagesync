-- Performance indexes for admin band-role lookups.

create index if not exists band_roles_band_id_role_created_idx
  on public.band_roles (band_id, band_role, created_at);

create index if not exists band_roles_profile_id_role_created_idx
  on public.band_roles (profile_id, band_role, created_at);
