export async function normalizeQueuePositions(
  supabase: any,
  filters: { bandId: string; eventId: string; statuses?: string[] }
) {
  const statuses = filters.statuses ?? ['pending', 'queued', 'requested']
  const { data, error } = await supabase
    .from('queue_items')
    .select('id, position')
    .eq('band_id', filters.bandId)
    .eq('event_id', filters.eventId)
    .in('status', statuses)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []) as Array<{ id: string; position: number | null }>
  for (let index = 0; index < rows.length; index += 1) {
    const nextPosition = index + 1
    if (rows[index].position !== nextPosition) {
      const { error: updateError } = await supabase.from('queue_items').update({ position: nextPosition }).eq('id', rows[index].id)
      if (updateError) {
        throw new Error(updateError.message)
      }
    }
  }
}
