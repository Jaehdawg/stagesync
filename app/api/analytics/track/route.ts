import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { recordAnalyticsEvent } from '@/lib/analytics-events'

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | {
        eventName?: unknown
        source?: unknown
        bandId?: unknown
        actorRole?: unknown
        actorUserId?: unknown
        entityType?: unknown
        entityId?: unknown
        properties?: unknown
      }
    | null

  const eventName = typeof body?.eventName === 'string' ? body.eventName : ''
  const source = typeof body?.source === 'string' ? body.source : ''
  const bandId = typeof body?.bandId === 'string' ? body.bandId : null
  const actorRole = typeof body?.actorRole === 'string' ? body.actorRole : undefined
  const actorUserId = typeof body?.actorUserId === 'string' ? body.actorUserId : null
  const entityType = typeof body?.entityType === 'string' ? body.entityType : null
  const entityId = typeof body?.entityId === 'string' ? body.entityId : null
  const properties = body?.properties && typeof body.properties === 'object' ? (body.properties as Record<string, unknown>) : {}

  if (!eventName || !source) {
    return NextResponse.json({ message: 'eventName and source are required.' }, { status: 400 })
  }

  const serviceSupabase = createServiceClient()
  const { error } = await recordAnalyticsEvent(serviceSupabase, {
    eventName,
    source,
    bandId,
    actorRole: (actorRole as 'admin' | 'band' | 'singer' | 'guest' | 'system' | undefined) ?? 'system',
    actorUserId,
    entityType,
    entityId,
    properties,
  })

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
