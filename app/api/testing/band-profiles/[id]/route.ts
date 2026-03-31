import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getTestSession } from '@/lib/test-session'
import { deleteTestBandProfileById, updateTestBandProfileById } from '@/lib/test-band-profile'

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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const testSession = await getTestSession()
  if (!testSession || testSession.role !== 'admin') {
    return NextResponse.json({ message: 'Admin test login required.' }, { status: 401 })
  }

  const { id } = await params
  const supabase = getSupabase(request)
  const formData = await request.formData()
  const action = String(formData.get('action') ?? '')

  try {
    if (action === 'delete') {
      await deleteTestBandProfileById(supabase, id)
    } else if (action === 'update') {
      await updateTestBandProfileById(supabase, id, {
        band_name: String(formData.get('bandName') ?? ''),
        website_url: String(formData.get('websiteUrl') ?? ''),
        facebook_url: String(formData.get('facebookUrl') ?? ''),
        instagram_url: String(formData.get('instagramUrl') ?? ''),
        tiktok_url: String(formData.get('tiktokUrl') ?? ''),
        paypal_url: String(formData.get('paypalUrl') ?? ''),
        venmo_url: String(formData.get('venmoUrl') ?? ''),
        cashapp_url: String(formData.get('cashappUrl') ?? ''),
        custom_message: String(formData.get('customMessage') ?? ''),
      })
    } else {
      return NextResponse.json({ message: 'Unknown action.' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to update band profile.' }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/admin/bands', request.url))
}
