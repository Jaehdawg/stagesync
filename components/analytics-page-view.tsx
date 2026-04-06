"use client"

import { useEffect } from 'react'

type AnalyticsPageViewProps = {
  eventName: string
  source: string
  bandId?: string | null
  properties?: Record<string, unknown>
}

export function AnalyticsPageView({ eventName, source, bandId = null, properties = {} }: AnalyticsPageViewProps) {
  useEffect(() => {
    void fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ eventName, source, bandId, properties }),
      keepalive: true,
    }).catch(() => {})
  }, [bandId, eventName, properties, source])

  return null
}
