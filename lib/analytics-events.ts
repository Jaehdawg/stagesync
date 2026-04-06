import { getAnalyticsTrackingPlan, type AnalyticsEventSpec } from './analytics-schema'

export type AnalyticsActorRole = 'admin' | 'band' | 'singer' | 'guest' | 'system'

export type AnalyticsEventInput = {
  eventName: string
  source: string
  bandId?: string | null
  actorRole?: AnalyticsActorRole
  actorUserId?: string | null
  entityType?: string | null
  entityId?: string | null
  properties?: Record<string, unknown>
  occurredAt?: Date
}

export type AnalyticsEventRecord = {
  band_id: string | null
  actor_role: AnalyticsActorRole
  actor_user_id: string | null
  event_name: string
  entity_type: string | null
  entity_id: string | null
  source: string
  properties: Record<string, unknown>
  occurred_at: string
}

function getSpec(eventName: string): AnalyticsEventSpec | null {
  return getAnalyticsTrackingPlan().eventSpecs.find((spec) => spec.name === eventName) ?? null
}

export function normalizeAnalyticsEventName(eventName: string) {
  return getSpec(eventName)?.name ?? null
}

export function buildAnalyticsEventRecord(input: AnalyticsEventInput): AnalyticsEventRecord | null {
  const eventName = normalizeAnalyticsEventName(input.eventName)
  if (!eventName || !input.source.trim()) {
    return null
  }

  return {
    band_id: input.bandId ?? null,
    actor_role: input.actorRole ?? 'system',
    actor_user_id: input.actorUserId ?? null,
    event_name: eventName,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    source: input.source.trim(),
    properties: input.properties ?? {},
    occurred_at: (input.occurredAt ?? new Date()).toISOString(),
  }
}

export async function recordAnalyticsEvent(client: { from: (table: string) => { insert: (payload: AnalyticsEventRecord) => PromiseLike<{ error: { message: string } | null }> } }, input: AnalyticsEventInput) {
  const record = buildAnalyticsEventRecord(input)
  if (!record) {
    return { error: new Error('Invalid analytics event payload.') }
  }

  const { error } = await client.from('analytics_events').insert(record)
  return { error: error ? new Error(error.message) : null, record }
}
