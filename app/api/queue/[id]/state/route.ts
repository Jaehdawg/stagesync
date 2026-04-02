import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { isBandAdminRequest } from '@/lib/band-auth'

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
    .select('id, band_id, event_id')
    .eq('id', id)
    .maybeSingle()

  if (findError) {
    return NextResponse.json({ message: findError.message }, { status: 500 })
  }

  if (!queueItem) {
    return NextResponse.json({ message: 'Queue item not found.' }, { status: 404 })
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
