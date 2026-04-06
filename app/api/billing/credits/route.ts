import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { getTestSession } from '@/lib/test-session'
import { getTestLogin } from '@/lib/test-login-list'
import { getLiveBandAccessContext } from '@/lib/band-access'
import { requiresPerEventPurchaseAcknowledgment, resolvePerEventBillingRedirect, type PerEventBillingIntent } from '@/lib/per-event-billing'

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
  return NextResponse.redirect(new URL(`/band/account?creditNotice=${encodeURIComponent(notice)}`, request.url), 303)
}

function redirectToHostedUrl(url: string) {
  return NextResponse.redirect(url, 303)
}

function getPerEventBillingConfig() {
  return {
    checkoutUrl: process.env.STAGESYNC_CREDIT_CHECKOUT_URL ?? null,
    receiptsUrl: process.env.STAGESYNC_CREDIT_RECEIPTS_URL ?? null,
  }
}

export async function POST(request: NextRequest) {
  const testSession = await getTestSession()
  const testSupabase = getSupabase(request)
  const serviceSupabase = createServiceClient()
  const formData = await request.formData()
  const intent = String(formData.get('intent') ?? '').trim()
  const acknowledgeTerms = String(formData.get('acknowledgeTerms') ?? '').trim()

  if (!['purchase', 'receipts'].includes(intent)) {
    return NextResponse.json({ message: 'Unknown per-event billing intent.' }, { status: 400 })
  }

  if (requiresPerEventPurchaseAcknowledgment(intent as PerEventBillingIntent) && acknowledgeTerms !== 'yes') {
    return redirectWithNotice(request, 'terms-required')
  }

  if (testSession?.role === 'band') {
    const current = await getTestLogin(testSupabase, testSession.username)
    if (!current || current.role !== 'band' || current.band_access_level !== 'admin') {
      return NextResponse.json({ message: 'Band admin access required.' }, { status: 403 })
    }

    const hosted = resolvePerEventBillingRedirect(intent as PerEventBillingIntent, getPerEventBillingConfig())
    return hosted.url ? redirectToHostedUrl(hosted.url) : redirectWithNotice(request, hosted.notice ?? 'no-change')
  }

  const liveAccess = await getLiveBandAccessContext(testSupabase, serviceSupabase, { requireAdmin: true })
  if (!liveAccess) {
    return NextResponse.json({ message: 'Band admin access required.' }, { status: 403 })
  }

  const hosted = resolvePerEventBillingRedirect(intent as PerEventBillingIntent, getPerEventBillingConfig())
  return hosted.url ? redirectToHostedUrl(hosted.url) : redirectWithNotice(request, hosted.notice ?? 'no-change')
}
