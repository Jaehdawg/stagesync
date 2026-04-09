import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '../../../../../utils/supabase/service'
import { getRequestAdminAccess } from '../../../../../lib/admin-access'
import { buildVenueProvisioningDraft } from '../../../../../lib/venue-provisioning-drafts'

const ALLOWED_STATUSES = ['new', 'reviewing', 'contacted', 'qualified', 'closed'] as const
const ALLOWED_QUEUES = ['venue-sales-hot', 'venue-sales-pricing', 'venue-sales-demo', 'venue-sales-nurture'] as const

type VenueLeadStatus = (typeof ALLOWED_STATUSES)[number]
type VenueLeadQueue = (typeof ALLOWED_QUEUES)[number]

function redirectWithNotice(request: NextRequest, notice: string) {
  return NextResponse.redirect(new URL(`/admin/venues?leadNotice=${encodeURIComponent(notice)}`, request.url), 303)
}

function parseStatus(value: FormDataEntryValue | null): VenueLeadStatus | null {
  const status = String(value ?? '').trim()
  return (ALLOWED_STATUSES as readonly string[]).includes(status) ? (status as VenueLeadStatus) : null
}

function parseQueue(value: FormDataEntryValue | null): VenueLeadQueue | null {
  const queue = String(value ?? '').trim()
  return (ALLOWED_QUEUES as readonly string[]).includes(queue) ? (queue as VenueLeadQueue) : null
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminAccess = await getRequestAdminAccess(request)
  if (!adminAccess) {
    return NextResponse.json({ message: 'Admin login required.' }, { status: 401 })
  }

  const { id: leadId } = await params
  const supabase = createServiceClient()
  const formData = await request.formData()
  const action = String(formData.get('action') ?? 'update')
  const status = parseStatus(formData.get('status'))
  const followUpQueue = parseQueue(formData.get('followUpQueue'))
  const operatorNotes = String(formData.get('operatorNotes') ?? '').trim()

  const { data: existingLead, error: lookupError } = await supabase
    .from('venue_leads')
    .select('id, company_name, contact_name, follow_up_queue, status, operator_notes')
    .eq('id', leadId)
    .maybeSingle()

  if (lookupError) {
    return NextResponse.json({ message: lookupError.message }, { status: 500 })
  }

  if (!existingLead) {
    return NextResponse.json({ message: 'Venue lead not found.' }, { status: 404 })
  }

  const nextStatus: VenueLeadStatus = action === 'create-draft' ? 'reviewing' : status ?? (existingLead.status as VenueLeadStatus)
  const nextQueue = action === 'create-draft' ? ('venue-sales-hot' as VenueLeadQueue) : followUpQueue ?? (existingLead.follow_up_queue as VenueLeadQueue)
  const nextNotes = operatorNotes || existingLead.operator_notes || null

  if (action !== 'create-draft' && !status) {
    return NextResponse.json({ message: 'Valid lead status is required.' }, { status: 400 })
  }

  const { error: updateError } = await supabase
    .from('venue_leads')
    .update({
      status: nextStatus,
      follow_up_queue: nextQueue,
      operator_notes: nextNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId)

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 500 })
  }

  if (action === 'create-draft') {
    const draft = buildVenueProvisioningDraft({
      venueLeadId: leadId,
      companyName: existingLead.company_name,
      contactName: existingLead.contact_name,
      createdBy: adminAccess.username,
      followUpQueue: nextQueue,
      operatorNotes: nextNotes,
    })

    const { error: draftError } = await supabase.from('venue_provisioning_drafts').upsert(
      {
        venue_lead_id: draft.venue_lead_id,
        company_name: draft.company_name,
        contact_name: draft.contact_name,
        status: draft.status,
        follow_up_queue: draft.follow_up_queue,
        operator_notes: draft.operator_notes,
        created_by: draft.created_by,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'venue_lead_id' }
    )

    if (draftError) {
      return NextResponse.json({ message: draftError.message }, { status: 500 })
    }
  }

  return redirectWithNotice(request, 'updated')
}
