import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { getTestSession } from '@/lib/test-session'
import { getLiveBandAccessContext } from '@/lib/band-access'

function getSupabase(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
        },
      },
    }
  )
}

export async function POST(request: NextRequest) {
  const testSession = await getTestSession()
  const authSupabase = getSupabase(request)
  const serviceSupabase = createServiceClient()
  const formData = await request.formData()

  const bandName = String(formData.get('bandName') ?? '').trim()
  const fields = {
    logo_url: String(formData.get('logoUrl') ?? '').trim() || null,
    website_url: String(formData.get('websiteUrl') ?? '').trim() || null,
    facebook_url: String(formData.get('facebookUrl') ?? '').trim() || null,
    instagram_url: String(formData.get('instagramUrl') ?? '').trim() || null,
    tiktok_url: String(formData.get('tiktokUrl') ?? '').trim() || null,
    paypal_url: String(formData.get('paypalUrl') ?? '').trim() || null,
    venmo_url: String(formData.get('venmoUrl') ?? '').trim() || null,
    cashapp_url: String(formData.get('cashappUrl') ?? '').trim() || null,
    custom_message: String(formData.get('customMessage') ?? '').trim() || null,
  }

  if (testSession?.role === 'band') {
    const bandId = testSession.activeBandId
    if (!bandId) {
      return NextResponse.json({ message: 'No active band selected.' }, { status: 400 })
    }

    const profileId = testSession.username
    const { error: bandError } = await serviceSupabase.from('bands').update({ band_name: bandName }).eq('id', bandId)
    if (bandError) {
      return NextResponse.json({ message: bandError.message }, { status: 500 })
    }

    const { error: profileError } = await serviceSupabase
      .from('band_profiles')
      .upsert(
        {
          band_id: bandId,
          profile_id: profileId,
          band_name: bandName,
          ...fields,
        },
        { onConflict: 'band_id' }
      )

    if (profileError) {
      return NextResponse.json({ message: profileError.message }, { status: 500 })
    }

    return NextResponse.redirect(new URL('/band/account', request.url))
  }

  const liveAccess = await getLiveBandAccessContext(authSupabase, serviceSupabase, { requireAdmin: true })
  if (!liveAccess) {
    return NextResponse.json({ message: 'Band admin access required.' }, { status: 403 })
  }

  const { error: bandError } = await serviceSupabase.from('bands').update({ band_name: bandName }).eq('id', liveAccess.bandId)
  if (bandError) {
    return NextResponse.json({ message: bandError.message }, { status: 500 })
  }

  const { error: profileError } = await serviceSupabase
    .from('band_profiles')
    .upsert(
      {
        band_id: liveAccess.bandId,
        profile_id: liveAccess.userId,
        band_name: bandName,
        ...fields,
      },
      { onConflict: 'band_id' }
    )

  if (profileError) {
    return NextResponse.json({ message: profileError.message }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/band/account', request.url))
}
