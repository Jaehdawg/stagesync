import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { resolveBillingLifecycleUpdate } from '@/lib/billing-lifecycle'
import { createStripeClient, getStripeBillingConfig, resolveStripeBillingLifecycleUpdate, type StripeWebhookLikeEvent } from '@/lib/stripe-billing'

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
  const stripeConfig = getStripeBillingConfig()
  const stripeSignature = request.headers?.get?.('stripe-signature') ?? null

  let payload: any = null
  let update = null

  if (stripeConfig.webhookSecret && stripeConfig.secretKey && stripeSignature) {
    try {
      const rawBody = await request.text()
      const stripe = createStripeClient(stripeConfig.secretKey)
      const event = stripe.webhooks.constructEvent(rawBody, stripeSignature, stripeConfig.webhookSecret)
      update = resolveStripeBillingLifecycleUpdate(event as unknown as StripeWebhookLikeEvent)
      payload = event.data?.object ?? null
    } catch (error) {
      return NextResponse.json({ message: error instanceof Error ? error.message : 'Invalid Stripe webhook signature.' }, { status: 400 })
    }
  } else {
    payload = await request.json().catch(() => null)
    update = resolveBillingLifecycleUpdate(payload ?? {})
  }

  if (!update) {
    return NextResponse.json({ message: 'No lifecycle update provided.' }, { status: 400 })
  }

  const billingAccountId = typeof payload?.billingAccountId === 'string' ? payload.billingAccountId : null
  const bandId = typeof payload?.bandId === 'string' ? payload.bandId : null

  if (!billingAccountId && !bandId) {
    return NextResponse.json({ message: 'Missing billing account identifier.' }, { status: 400 })
  }

  const supabase = getSupabase(request)
  const serviceSupabase = createServiceClient()

  const query = serviceSupabase.from('billing_accounts').update({
    ...(update.status ? { status: update.status } : {}),
    ...(update.paymentProvider !== undefined ? { payment_provider: update.paymentProvider } : {}),
    ...(update.paymentCustomerId !== undefined ? { payment_customer_id: update.paymentCustomerId } : {}),
    ...(update.paymentSubscriptionId !== undefined ? { payment_subscription_id: update.paymentSubscriptionId } : {}),
    updated_at: new Date().toISOString(),
  })

  const result = billingAccountId
    ? await query.eq('id', billingAccountId).select('id').maybeSingle()
    : await query.eq('band_id', bandId).select('id').maybeSingle()

  if (result.error) {
    return NextResponse.json({ message: result.error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
