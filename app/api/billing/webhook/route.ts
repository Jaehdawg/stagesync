import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { recordAnalyticsEvent } from '@/lib/analytics-events'
import { resolveBillingLifecycleUpdate } from '@/lib/billing-lifecycle'
import { createStripeClient, getStripeBillingConfig, resolveStripeBillingLifecycleUpdate, type StripeWebhookLikeEvent } from '@/lib/stripe-billing'

type WebhookPayload = {
  billingAccountId?: string | null
  bandId?: string | null
}

export async function POST(request: NextRequest) {
  const stripeConfig = getStripeBillingConfig()
  const stripeSignature = request.headers?.get?.('stripe-signature') ?? null
  const isProduction = process.env.NODE_ENV === 'production'

  let payload: WebhookPayload | null = null
  let update = null

  if (stripeConfig.webhookSecret && stripeConfig.secretKey && stripeSignature) {
    try {
      const rawBody = await request.text()
      const stripe = createStripeClient(stripeConfig.secretKey)
      const event = stripe.webhooks.constructEvent(rawBody, stripeSignature, stripeConfig.webhookSecret)
      update = resolveStripeBillingLifecycleUpdate(event as unknown as StripeWebhookLikeEvent)
      const object = event.data?.object as { metadata?: Record<string, string | undefined> } | undefined
      payload = {
        billingAccountId: object?.metadata?.billing_account_id ?? object?.metadata?.billingAccountId ?? null,
        bandId: object?.metadata?.band_id ?? object?.metadata?.bandId ?? null,
      }
    } catch (error) {
      return NextResponse.json({ message: error instanceof Error ? error.message : 'Invalid Stripe webhook signature.' }, { status: 400 })
    }
  } else if (isProduction) {
    return NextResponse.json({ message: 'Stripe webhook signature is required.' }, { status: 400 })
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

  if (bandId) {
    const eventName = update.status === 'canceled' || update.status === 'suspended'
      ? 'subscription.churned'
      : update.status === 'active' || update.status === 'trialing'
        ? 'subscription.started'
        : 'billing.status.changed'

    void recordAnalyticsEvent(serviceSupabase, {
      eventName,
      source: 'api.billing.webhook',
      bandId,
      actorRole: 'system',
      entityType: 'billing_accounts',
      entityId: billingAccountId ?? null,
      properties: {
        status: update.status ?? null,
        paymentProvider: update.paymentProvider ?? null,
      },
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
