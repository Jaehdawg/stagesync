import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { recordAnalyticsEvent } from '@/lib/analytics-events'

function safeNextPath(value: string | null) {
  if (!value) return '/'
  if (!value.startsWith('/')) return '/'
  return value
}

export async function GET(request: NextRequest) {
  const eventName = request.nextUrl.searchParams.get('eventName') ?? ''
  const source = request.nextUrl.searchParams.get('source') ?? ''
  const nextPath = safeNextPath(request.nextUrl.searchParams.get('next'))
  const bandId = request.nextUrl.searchParams.get('bandId')
  const actorRole = request.nextUrl.searchParams.get('actorRole')

  if (!eventName || !source) {
    return NextResponse.redirect(new URL(nextPath, request.url), 303)
  }

  await recordAnalyticsEvent(createServiceClient(), {
    eventName,
    source,
    bandId,
    actorRole: (actorRole as 'admin' | 'band' | 'singer' | 'guest' | 'system' | null) ?? 'system',
    properties: {
      next: nextPath,
    },
  })

  return NextResponse.redirect(new URL(nextPath, request.url), 303)
}
