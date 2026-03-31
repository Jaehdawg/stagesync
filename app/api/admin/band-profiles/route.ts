import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const action = String(formData.get('action') ?? '')
  const supabase = createServiceClient()

  try {
    if (action === 'create') {
      const { error } = await supabase.from('band_profiles').insert({
        profile_id: String(formData.get('profileId') ?? '').trim(),
        band_name: String(formData.get('bandName') ?? '').trim(),
        logo_url: String(formData.get('logoUrl') ?? '').trim() || null,
        website_url: String(formData.get('websiteUrl') ?? '').trim() || null,
        facebook_url: String(formData.get('facebookUrl') ?? '').trim() || null,
        instagram_url: String(formData.get('instagramUrl') ?? '').trim() || null,
        tiktok_url: String(formData.get('tiktokUrl') ?? '').trim() || null,
        paypal_url: String(formData.get('paypalUrl') ?? '').trim() || null,
        venmo_url: String(formData.get('venmoUrl') ?? '').trim() || null,
        cashapp_url: String(formData.get('cashappUrl') ?? '').trim() || null,
        custom_message: String(formData.get('customMessage') ?? '').trim() || null,
      })
      if (error) throw error
    } else {
      return NextResponse.json({ message: 'Unknown action.' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to create band profile.' }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/admin/band-profiles', request.url))
}
