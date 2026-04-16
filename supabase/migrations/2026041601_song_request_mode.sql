alter table public.show_settings
  add column if not exists request_mode_enabled boolean not null default false,
  add column if not exists request_source_mode text not null default 'set_list';

alter table public.show_settings
  drop constraint if exists show_settings_request_source_mode_check;
alter table public.show_settings
  add constraint show_settings_request_source_mode_check
    check (request_source_mode in ('set_list', 'uploaded', 'tidal_catalog'));

alter table public.test_show_settings
  add column if not exists request_mode_enabled boolean not null default false,
  add column if not exists request_source_mode text not null default 'set_list';

alter table public.test_show_settings
  drop constraint if exists test_show_settings_request_source_mode_check;
alter table public.test_show_settings
  add constraint test_show_settings_request_source_mode_check
    check (request_source_mode in ('set_list', 'uploaded', 'tidal_catalog'));
