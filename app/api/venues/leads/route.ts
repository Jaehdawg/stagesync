import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { getVenueLeadFollowUpQueue, type VenueLeadInterestLevel } from '@/lib/venue-leads'

function getFormValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? '').trim()
  return value.length ? value : null
}

function redirectWithNotice(request: NextRequest, notice: string) {
  return NextResponse.redirect(new URL(`/venues?leadNotice=${encodeURIComponent(notice)}`, request.url), 303)
}

export async function POST(request: NextRequest) {
  const serviceSupabase = createServiceClient()
  const formData = await request.formData()

  const companyName = getFormValue(formData, 'companyName')
  const contactName = getFormValue(formData, 'contactName')
  const email = getFormValue(formData, 'email')
  const roomsCount = Number.parseInt(String(formData.get('roomsCount') ?? ''), 10)
  const interestLevel = String(formData.get('interestLevel') ?? '').trim() as VenueLeadInterestLevel
  const phone = getFormValue(formData, 'phone')
  const city = getFormValue(formData, 'city')
  const bandsCountRaw = getFormValue(formData, 'bandsCount')
  const message = getFormValue(formData, 'message')

  if (!companyName || !contactName || !email || !Number.isFinite(roomsCount) || roomsCount < 0 || !['explore', 'demo', 'pricing', 'ready'].includes(interestLevel)) {
    return redirectWithNotice(request, 'missing-fields')
  }

  const bandsCount = bandsCountRaw ? Number.parseInt(bandsCountRaw, 10) : null
  const lead = {
    company_name: companyName,
    contact_name: contactName,
    email,
    phone,
    city,
    rooms_count: roomsCount,
    bands_count: Number.isFinite(bandsCount ?? NaN) ? bandsCount : null,
    interest_level: interestLevel,
    message,
    follow_up_queue: getVenueLeadFollowUpQueue(interestLevel),
    status: 'new',
    source: 'request-demo',
  }

  const { error } = await serviceSupabase.from('venue_leads').insert(lead)
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return redirectWithNotice(request, 'submitted')
}
