import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/utils/supabase/service'
import { getTestSession } from '@/lib/test-session'
import { getTestLogin } from '@/lib/test-login-list'
import { getLiveBandAccessContext } from '@/lib/band-access'
import { getStripeBillingConfig } from '@/lib/stripe-billing'
import { getStripeBillingReadiness } from '@/lib/stripe-billing-readiness'

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

export async function GET(request: NextRequest) {
  const testSession = await getTestSession()
  const supabase = getSupabase(request)
  const serviceSupabase = createServiceClient()
  const liveAccess = await getLiveBandAccessContext(supabase, serviceSupabase, { requireAdmin: true })

  if (testSession?.role !== 'band' && !liveAccess) {
    return NextResponse.json({ message: 'Band admin access required.' }, { status: 403 })
  }

  if (testSession?.role === 'band') {
    const current = await getTestLogin(supabase, testSession.username)
    if (!current || current.role !== 'band' || current.band_access_level !== 'admin') {
      return NextResponse.json({ message: 'Band admin access required.' }, { status: 403 })
    }
  }

  return NextResponse.json({
    stripe: getStripeBillingReadiness(getStripeBillingConfig(), {
      checkoutUrl: process.env.STAGESYNC_BILLING_CHECKOUT_URL ?? null,
      portalUrl: process.env.STAGESYNC_BILLING_PORTAL_URL ?? null,
      invoicesUrl: process.env.STAGESYNC_BILLING_INVOICES_URL ?? null,
    }),
  })
}
