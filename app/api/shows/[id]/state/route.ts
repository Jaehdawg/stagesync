import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { recordAnalyticsEvent } from '@/lib/analytics-events'
import { buildCreditConsumptionEntry } from '@/lib/billing'
import { resolveShowLifecycleTransition } from '@/lib/show-lifecycle'

type RouteContext = {
  params: Promise<{ id: string }>
}

async function getAuthenticatedBandUser(request: NextRequest) {
  const supabase = createServerClient(
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { supabase, user: null }
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()

  if (profile?.role !== 'band' && profile?.role !== 'admin') {
    return { supabase, user: null }
  }

  return { supabase, user }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { supabase, user } = await getAuthenticatedBandUser(request)
  const { id } = await context.params
  const formData = await request.formData()
  const action = String(formData.get('action') ?? '')
  const referer = request.headers.get('referer') ?? new URL('/band', request.url).toString()

  if (!user) {
    return NextResponse.redirect(new URL('/band', request.url))
  }

  if (!['start', 'pause', 'resume', 'end', 'undo'].includes(action)) {
    return NextResponse.redirect(referer)
  }

  const { data: event } = await supabase
    .from('events')
    .select('band_id')
    .eq('id', id)
    .maybeSingle()

  const { data: billingAccount } = event?.band_id
    ? await supabase
        .from('billing_accounts')
        .select('id')
        .eq('band_id', event.band_id)
        .maybeSingle()
    : { data: null }

  const { data: currentWindow } = await supabase
    .from('billing_show_windows')
    .select('started_at, expires_at, consumed_credit_at, undo_grace_until, restart_count')
    .eq('event_id', id)
    .maybeSingle()

  const transition = resolveShowLifecycleTransition(action as 'start' | 'pause' | 'resume' | 'end' | 'undo', {
    bandId: String(event?.band_id ?? ''),
    eventId: id,
    billingAccountId: billingAccount?.id ?? null,
    currentWindow: currentWindow
      ? {
          startedAt: currentWindow.started_at,
          expiresAt: currentWindow.expires_at,
          consumedCreditAt: currentWindow.consumed_credit_at,
          undoGraceUntil: currentWindow.undo_grace_until,
          restartCount: currentWindow.restart_count ?? 0,
        }
      : null,
  })

  const { error } = await supabase.from('events').update(transition.eventUpdate).eq('id', id)

  if (error) {
    return NextResponse.redirect(new URL(`/band?error=${encodeURIComponent(error.message)}`, request.url))
  }

  const analyticsEventName = action === 'pause'
    ? 'show.paused'
    : action === 'end'
      ? 'show.ended'
      : 'show.started'

  void recordAnalyticsEvent(createServiceClient(), {
    eventName: analyticsEventName,
    source: 'band.show.state',
    bandId: transition.windowUpdate?.bandId ?? event?.band_id ?? null,
    actorRole: 'band',
    actorUserId: user.id,
    entityType: 'events',
    entityId: id,
    properties: { action },
  }).catch(() => {})

  if (transition.windowUpdate && transition.windowUpdate.billingAccountId) {
    const shouldRecordConsumption = transition.windowUpdate.consumedCreditAt !== null && (!currentWindow?.consumed_credit_at || currentWindow.consumed_credit_at === null)

    if (shouldRecordConsumption) {
      const { error: ledgerError } = await supabase.from('billing_credit_ledger').insert(
        buildCreditConsumptionEntry({
          bandId: transition.windowUpdate.bandId,
          eventId: transition.windowUpdate.eventId,
          billingAccountId: transition.windowUpdate.billingAccountId,
          provider: 'internal',
          note: action === 'start' ? 'First show start consumed one paid access credit.' : 'Show restart consumed one paid access credit.',
        })
      )

      if (ledgerError) {
        return NextResponse.redirect(new URL(`/band?error=${encodeURIComponent(ledgerError.message)}`, request.url))
      }
    }

    const { error: windowError } = await supabase.from('billing_show_windows').upsert({
      billing_account_id: transition.windowUpdate.billingAccountId,
      band_id: transition.windowUpdate.bandId,
      event_id: transition.windowUpdate.eventId,
      started_at: transition.windowUpdate.startedAt,
      expires_at: transition.windowUpdate.expiresAt,
      undo_grace_until: transition.windowUpdate.undoGraceUntil,
      consumed_credit_at: transition.windowUpdate.consumedCreditAt,
      restart_count: transition.windowUpdate.restartCount,
      is_paid_window: transition.windowUpdate.isPaidWindow,
    }, { onConflict: 'event_id' })

    if (windowError) {
      return NextResponse.redirect(new URL(`/band?error=${encodeURIComponent(windowError.message)}`, request.url))
    }
  }

  return NextResponse.redirect(referer)
}
