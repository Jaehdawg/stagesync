create or replace function public.get_admin_recent_shows(limit_count integer default 5)
returns table (
  id uuid,
  name text,
  is_active boolean,
  allow_signups boolean,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select e.id, e.name, e.is_active, e.allow_signups, e.created_at
  from public.events e
  where e.created_at >= now() - interval '30 days'
  order by e.created_at desc
  limit greatest(limit_count, 0);
$$;
