import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '../../../../../utils/supabase/service'
import { getTestSession } from '../../../../../lib/test-session'
import { upsertBandRole, removeBandRole } from '../../../../../lib/band-roles'

async function upsertBandProfileRecord(
  supabase: ReturnType<typeof createServiceClient>,
  bandId: string,
  bandName: string,
  fields: Record<string, string | null>
) {
  const { error } = await supabase.from('band_profiles').upsert(
    {
      band_id: bandId,
      band_name: bandName,
      website_url: fields.website_url,
      facebook_url: fields.facebook_url,
      instagram_url: fields.instagram_url,
      tiktok_url: fields.tiktok_url,
      paypal_url: fields.paypal_url,
      venmo_url: fields.venmo_url,
      cashapp_url: fields.cashapp_url,
      custom_message: fields.custom_message,
      logo_url: fields.logo_url,
    },
    { onConflict: 'band_id' }
  )

  if (error) {
    throw error
  }
}

async function deleteBandCascade(supabase: ReturnType<typeof createServiceClient>, bandId: string) {
  await Promise.all([
    supabase.from('band_roles').delete().eq('band_id', bandId),
    supabase.from('band_profiles').delete().eq('band_id', bandId),
    supabase.from('show_settings').delete().eq('band_id', bandId),
    supabase.from('queue_items').delete().eq('band_id', bandId),
    supabase.from('songs').delete().eq('band_id', bandId),
    supabase.from('singer_messages').delete().eq('band_id', bandId),
    supabase.from('song_import_jobs').delete().eq('band_id', bandId),
    supabase.from('events').delete().eq('band_id', bandId),
    supabase.from('band_memberships').delete().eq('band_id', bandId),
  ])

  const { error } = await supabase.from('bands').delete().eq('id', bandId)
  if (error) {
    throw error
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const testSession = await getTestSession()
  if (!testSession || testSession.role !== 'admin') {
    return NextResponse.json({ message: 'Admin test login required.' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const { id: bandId } = await params
  const formData = await request.formData()
  const action = String(formData.get('action') ?? '')

  try {
    if (action === 'delete') {
      await deleteBandCascade(supabase, bandId)
      return NextResponse.redirect(new URL('/admin/bands', request.url))
    }

    if (action === 'update') {
      const bandName = String(formData.get('bandName') ?? '').trim()
      if (!bandName) {
        return NextResponse.json({ message: 'Band name is required.' }, { status: 400 })
      }

      const { error: bandError } = await supabase.from('bands').update({ band_name: bandName }).eq('id', bandId)
      if (bandError) {
        return NextResponse.json({ message: bandError.message }, { status: 500 })
      }

      await upsertBandProfileRecord(supabase, bandId, bandName, {
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

      return NextResponse.redirect(new URL('/admin/bands', request.url))
    }

    if (action === 'add-role') {
      let profileId = String(formData.get('profileId') ?? '').trim()
      const profileLookup = String(formData.get('profileLookup') ?? '').trim().toLowerCase()
      const bandRole = String(formData.get('bandRole') ?? 'member') === 'admin' ? 'admin' : 'member'
      if (!profileId && profileLookup) {
        const { data: foundProfile, error: profileLookupError } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', profileLookup)
          .maybeSingle()

        if (profileLookupError) {
          return NextResponse.json({ message: profileLookupError.message }, { status: 500 })
        }

        profileId = foundProfile?.id ?? ''
      }
      if (!profileId) {
        return NextResponse.json({ message: 'Profile is required.' }, { status: 400 })
      }
      await upsertBandRole(supabase, bandId, profileId, bandRole, true)
      return NextResponse.redirect(new URL('/admin/bands', request.url))
    }

    if (action === 'remove-role') {
      const profileId = String(formData.get('profileId') ?? '').trim()
      if (!profileId) {
        return NextResponse.json({ message: 'Profile is required.' }, { status: 400 })
      }
      await removeBandRole(supabase, bandId, profileId)
      return NextResponse.redirect(new URL('/admin/bands', request.url))
    }

    return NextResponse.json({ message: 'Unknown action.' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to update band.' }, { status: 500 })
  }
}
