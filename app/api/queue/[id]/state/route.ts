import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { isBandAdminRequest } from '@/lib/band-auth'

async function swapQueuePositions(supabase: ReturnType<typeof createServiceClient>, queueItem: { id: string; band_id: string; event_id: string; position: number | null }, direction: 'up' | 'down') {
  const { data: siblings, error } = await supabase
    .from('queue_items')
    .select('id, position, status')
    .eq('band_id', queueItem.band_id)
    .eq('event_id', queueItem.event_id)
    .in('status', ['queued', 'pending'])
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  const siblingRows = siblings ?? []
  const index = siblingRows.findIndex((item) => item.id === queueItem.id)
  if (index < 0) {
    return false
  }

  const swapIndex = direction === 'up' ? index - 1 : index + 1
  if (swapIndex < 0 || swapIndex >= siblingRows.length) {
    return false
  }

  const current = siblingRows[index]
  const neighbor = siblingRows[swapIndex]
  const currentPosition = current.position ?? index + 1
  const neighborPosition = neighbor.position ?? swapIndex + 1

  const { error: currentError } = await supabase.from('queue_items').update({ position: neighborPosition }).eq('id', current.id)
  if (currentError) throw new Error(currentError.message)

  const { error: neighborError } = await supabase.from('queue_items').update({ position: currentPosition }).eq('id', neighbor.id)
  if (neighborError) throw new Error(neighborError.message)

  return true
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await isBandAdminRequest(request))) {
    return NextResponse.json({ message: 'Band access required.' }, { status: 401 })
  }

  const { id } = await context.params
  const formData = await request.formData()
  const action = String(formData.get('action') ?? '').trim().toLowerCase()

  const serviceSupabase = createServiceClient()
  const { data: queueItem, error: findError } = await serviceSupabase
    .from('queue_items')
    .select('id, band_id, event_id, position')
    .eq('id', id)
    .maybeSingle()

  if (findError) {
    return NextResponse.json({ message: findError.message }, { status: 500 })
  }

  if (!queueItem) {
    return NextResponse.json({ message: 'Queue item not found.' }, { status: 404 })
  }

  if (action === 'up' || action === 'down') {
    try {
      const moved = await swapQueuePositions(serviceSupabase, queueItem, action)
      if (!moved) {
        return NextResponse.json({ message: `Queue item already at the ${action === 'up' ? 'top' : 'bottom'}.` })
      }
      return NextResponse.json({ message: `Queue item moved ${action}.` })
    } catch (error) {
      return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to move queue item.' }, { status: 500 })
    }
  }

  const nextStatus = action === 'play' || action === 'played'
    ? 'played'
    : action === 'remove' || action === 'cancel' || action === 'cancelled'
      ? 'cancelled'
      : null

  if (!nextStatus) {
    return NextResponse.json({ message: 'Unknown queue action.' }, { status: 400 })
  }

  const { error } = await serviceSupabase.from('queue_items').update({ status: nextStatus }).eq('id', id)
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: `Queue item marked ${nextStatus}.` })
}
