-- Remove the legacy 3-arg test_update_show_settings overload from production.

DROP FUNCTION IF EXISTS public.test_update_show_settings(uuid, integer, integer);
