import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { getTestSession } from '@/lib/test-session'
import { getTestLogin } from '@/lib/test-login-list'
import { getLiveBandAccessContext } from '@/lib/band-access'
import { resolveSubscriptionNoticeForIntent } from '@/lib/subscription-sync'

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

function redirectWithNotice(request: NextRequest, notice: string) {
  return NextResponse.redirect(new URL(`/band/account?subscriptionNotice=${encodeURIComponent(notice)}`, request.url), 303)
}

export async function POST(request: NextRequest) {
  const testSession = await getTestSession()
  const testSupabase = getSupabase(request)
  const serviceSupabase = createServiceClient()
  const formData = await request.formData()
  const intent = String(formData.get('intent') ?? '').trim()

  if (!['upgrade', 'manage', 'downgrade', 'stay'].includes(intent)) {
    return NextResponse.json({ message: 'Unknown billing intent.' }, { status: 400 })
  }

  if (testSession?.role === 'band') {
    const current = await getTestLogin(testSupabase, testSession.username)
    if (!current || current.role !== 'band' || current.band_access_level !== 'admin') {
      return NextResponse.json({ message: 'Band admin access required.' }, { status: 403 })
    }

    return redirectWithNotice(request, resolveSubscriptionNoticeForIntent(intent as 'upgrade' | 'manage' | 'downgrade' | 'stay'))
  }

  const liveAccess = await getLiveBandAccessContext(testSupabase, serviceSupabase, { requireAdmin: true })
  if (!liveAccess) {
    return NextResponse.json({ message: 'Band admin access required.' }, { status: 403 })
  }

  return redirectWithNotice(request, resolveSubscriptionNoticeForIntent(intent as 'upgrade' | 'manage' | 'downgrade' | 'stay'))
}
