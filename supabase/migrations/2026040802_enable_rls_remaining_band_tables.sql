-- Re-enable RLS on the remaining legacy band/test tables.
-- Permissive policies preserve the current server-side anon routes until those flows are tightened later.

alter table public.bands enable row level security;
alter table public.band_memberships enable row level security;
alter table public.test_band_profiles enable row level security;
alter table public.test_logins enable row level security;
alter table public.test_show_settings enable row level security;
alter table public.test_shows enable row level security;

do $$
begin
  create policy bands_allow_all on public.bands
    for all
    to anon, authenticated, service_role
    using (true)
    with check (true);
exception when duplicate_object then null; end $$;

do $$
begin
  create policy band_memberships_allow_all on public.band_memberships
    for all
    to anon, authenticated, service_role
    using (true)
    with check (true);
exception when duplicate_object then null; end $$;

do $$
begin
  create policy test_band_profiles_allow_all on public.test_band_profiles
    for all
    to anon, authenticated, service_role
    using (true)
    with check (true);
exception when duplicate_object then null; end $$;

do $$
begin
  create policy test_logins_allow_all on public.test_logins
    for all
    to anon, authenticated, service_role
    using (true)
    with check (true);
exception when duplicate_object then null; end $$;

do $$
begin
  create policy test_show_settings_allow_all on public.test_show_settings
    for all
    to anon, authenticated, service_role
    using (true)
    with check (true);
exception when duplicate_object then null; end $$;

do $$
begin
  create policy test_shows_allow_all on public.test_shows
    for all
    to anon, authenticated, service_role
    using (true)
    with check (true);
exception when duplicate_object then null; end $$;
