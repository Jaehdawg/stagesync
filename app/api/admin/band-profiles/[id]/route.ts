import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'

async function bandNameExists(supabase: ReturnType<typeof createServiceClient>, bandName: string, excludeId: string) {
  const { data, error } = await supabase.from('band_profiles').select('id').ilike('band_name', bandName).neq('id', excludeId).limit(1)
  if (error) throw error
  return (data?.length ?? 0) > 0
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const formData = await request.formData()
  const action = String(formData.get('action') ?? '')
  const supabase = createServiceClient()

  try {
    if (action === 'delete') {
      const { error } = await supabase.from('band_profiles').delete().eq('id', id)
      if (error) throw error
    } else if (action === 'update') {
      const bandName = String(formData.get('bandName') ?? '').trim()
      if (!bandName) {
        return NextResponse.json({ message: 'Band name is required.' }, { status: 400 })
      }

      if (await bandNameExists(supabase, bandName, id)) {
        return NextResponse.json({ message: 'A band with that name already exists.' }, { status: 409 })
      }

      const { error } = await supabase
        .from('band_profiles')
        .update({
          band_name: bandName,
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
        .eq('id', id)
      if (error) throw error
    } else {
      return NextResponse.json({ message: 'Unknown action.' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to update band profile.' }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/admin/band-profiles', request.url))
}
