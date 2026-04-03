'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type QueueActionButtonsProps = {
  queueItemId: string | null | undefined
  action: 'played' | 'remove' | 'up' | 'down'
  label: string
}

export function QueueActionButtons({ queueItemId, action, label }: QueueActionButtonsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    if (!queueItemId || loading) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/queue/${queueItemId}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ action }).toString(),
      })

      const payload = (await response.json().catch(() => ({}))) as { message?: string }
      if (!response.ok) {
        throw new Error(payload.message ?? 'Unable to update queue item.')
      }

      router.refresh()
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Unable to update queue item.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={!queueItemId || loading}
        className="rounded-full border border-white/10 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? '…' : label}
      </button>
      {error ? <p className="mt-2 w-full text-left text-xs text-rose-300">{error}</p> : null}
    </>
  )
}
