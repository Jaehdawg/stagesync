import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { recordAnalyticsEvent } from '@/lib/analytics-events'
import { getTestSession } from '@/lib/test-session'
import { getTestLogin } from '@/lib/test-login-list'
import { getLiveBandAccessContext } from '@/lib/band-access'
import { resolveHostedBillingRedirect } from '@/lib/hosted-billing'
import {
  buildStripeCheckoutRequest,
  buildStripePortalRequest,
  createStripeClient,
  getStripeBillingConfig,
  hasStripeCheckoutConfig,
} from '@/lib/stripe-billing'
import { type SubscriptionBillingIntent } from '@/lib/subscription-sync'

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

function redirectToHostedUrl(url: string) {
  return NextResponse.redirect(url, 303)
}

function getHostedBillingConfig() {
  return {
    checkoutUrl: process.env.STAGESYNC_BILLING_CHECKOUT_URL ?? null,
    portalUrl: process.env.STAGESYNC_BILLING_PORTAL_URL ?? null,
    invoicesUrl: process.env.STAGESYNC_BILLING_INVOICES_URL ?? null,
  }
}

function getBillingRedirectUrls(request: NextRequest) {
  return {
    successUrl: new URL('/band/account?subscriptionNotice=checkout-complete', request.url).toString(),
    cancelUrl: new URL('/band/account?subscriptionNotice=checkout-canceled', request.url).toString(),
    returnUrl: new URL('/band/account?subscriptionNotice=portal-return', request.url).toString(),
  }
}

export async function POST(request: NextRequest) {
  const testSession = await getTestSession()
  const testSupabase = getSupabase(request)
  const serviceSupabase = createServiceClient()
  const formData = await request.formData()
  const intent = String(formData.get('intent') ?? '').trim()
  const stripeBillingConfig = getStripeBillingConfig()
  const hostedBillingConfig = getHostedBillingConfig()

  if (!['upgrade', 'manage', 'downgrade', 'stay', 'invoices'].includes(intent)) {
    return NextResponse.json({ message: 'Unknown billing intent.' }, { status: 400 })
  }

  if (testSession?.role === 'band') {
    const current = await getTestLogin(testSupabase, testSession.username)
    if (!current || current.role !== 'band' || current.band_access_level !== 'admin') {
      return NextResponse.json({ message: 'Band admin access required.' }, { status: 403 })
    }

    const hosted = resolveHostedBillingRedirect(intent as SubscriptionBillingIntent, hostedBillingConfig)
    if (intent === 'upgrade') {
      void recordAnalyticsEvent(createServiceClient(), {
        eventName: 'subscription.started',
        source: 'band.account.subscription',
        actorRole: 'band',
        properties: { intent },
      }).catch(() => {})
    }
    if (hosted.url) {
      return redirectToHostedUrl(hosted.url)
    }

    return redirectWithNotice(request, hosted.notice ?? 'no-change')
  }

  const liveAccess = await getLiveBandAccessContext(testSupabase, serviceSupabase, { requireAdmin: true })
  if (!liveAccess) {
    return NextResponse.json({ message: 'Band admin access required.' }, { status: 403 })
  }

  const hosted = resolveHostedBillingRedirect(intent as SubscriptionBillingIntent, hostedBillingConfig)
  if (intent === 'upgrade') {
    void recordAnalyticsEvent(serviceSupabase, {
      eventName: 'subscription.started',
      source: 'band.account.subscription',
      bandId: liveAccess.bandId,
      actorRole: 'band',
      actorUserId: liveAccess.userId,
      properties: { intent },
    }).catch(() => {})
  }
  if (intent === 'invoices' && hosted.url) {
    return redirectToHostedUrl(hosted.url)
  }

  if (hasStripeCheckoutConfig(stripeBillingConfig)) {
    const billingAccount = await serviceSupabase
      .from('billing_accounts')
      .select('id, payment_customer_id')
      .eq('band_id', liveAccess.bandId)
      .maybeSingle()

    const { data: { user } } = await testSupabase.auth.getUser()
    const stripe = createStripeClient(stripeBillingConfig.secretKey!)
    const urls = getBillingRedirectUrls(request)
    if (intent === 'upgrade') {
      const session = await stripe.checkout.sessions.create(
        buildStripeCheckoutRequest({
          bandId: liveAccess.bandId,
          bandName: liveAccess.bandName,
          customerEmail: user?.email ?? null,
          professionalPriceId: stripeBillingConfig.professionalPriceId!,
          successUrl: urls.successUrl,
          cancelUrl: urls.cancelUrl,
        })
      )

      if (session.url) {
        return redirectToHostedUrl(session.url)
      }
    }

    if (intent === 'invoices' && hosted.url) {
      return redirectToHostedUrl(hosted.url)
    }

    if ((intent === 'manage' || intent === 'downgrade' || intent === 'invoices') && billingAccount.data?.payment_customer_id) {
      const session = await stripe.billingPortal.sessions.create(
        buildStripePortalRequest({
          customerId: billingAccount.data.payment_customer_id,
          returnUrl: urls.returnUrl,
        })
      )

      if (session.url) {
        return redirectToHostedUrl(session.url)
      }
    }
  }

  return hosted.url ? redirectToHostedUrl(hosted.url) : redirectWithNotice(request, hosted.notice ?? 'no-change')
}
