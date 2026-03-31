import { createClient } from '@/utils/supabase/server';

export default async function Notes() {
  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from('events')
    .select('id, name, description, is_active, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    return <pre>{error.message}</pre>
  }

  return <pre>{JSON.stringify(events, null, 2)}</pre>
}
