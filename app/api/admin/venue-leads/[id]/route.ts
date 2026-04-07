import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { getRequestAdminAccess } from '@/lib/admin-access'

const VALID_STATUSES = ['new', 'reviewing', 'contacted', 'qualified', 'closed'] as const

function getFormValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? '').trim()
  return value.length ? value : null
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminAccess = await getRequestAdminAccess(request)
  if (!adminAccess) {
    return NextResponse.json({ message: 'Admin login required.' }, { status: 401 })
  }

  const { id } = await params
  const formData = await request.formData()
  const action = String(formData.get('action') ?? '').trim()

  if (action !== 'update') {
    return NextResponse.json({ message: 'Unknown action.' }, { status: 400 })
  }

  const status = String(formData.get('status') ?? '').trim()
  if (!VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    return NextResponse.json({ message: 'Valid lead status is required.' }, { status: 400 })
  }

  const operatorNotes = getFormValue(formData, 'operatorNotes')
  const commercialTerms = getFormValue(formData, 'commercialTerms')
  const followUpQueue = getFormValue(formData, 'followUpQueue')

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('venue_leads')
    .update({
      status,
      operator_notes: operatorNotes,
      commercial_terms: commercialTerms,
      ...(followUpQueue ? { follow_up_queue: followUpQueue } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }

  return NextResponse.redirect(new URL('/admin/venues', request.url), 303)
}
