-- Tighten RLS on legacy band/test tables now that the app routes use service-role access.


drop policy if exists bands_allow_all on public.bands;
drop policy if exists band_memberships_allow_all on public.band_memberships;
drop policy if exists test_band_profiles_allow_all on public.test_band_profiles;
drop policy if exists test_logins_allow_all on public.test_logins;
drop policy if exists test_show_settings_allow_all on public.test_show_settings;
drop policy if exists test_shows_allow_all on public.test_shows;
