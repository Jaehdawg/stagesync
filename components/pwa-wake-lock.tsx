'use client'

import { useEffect } from 'react'

type WakeLockHandle = {
  release: () => Promise<void>
}

type WakeLockNavigator = Navigator & {
  standalone?: boolean
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockHandle>
  }
}

function isPwaStandalone() {
  if (typeof window === 'undefined') return false

  const standaloneMedia = window.matchMedia?.('(display-mode: standalone)')?.matches ?? false
  const iosStandalone = (navigator as WakeLockNavigator).standalone === true

  return standaloneMedia || iosStandalone
}

export function PwaWakeLock() {
  useEffect(() => {
    if (!isPwaStandalone() || !('wakeLock' in navigator)) {
      return
    }

    let cancelled = false
    let wakeLock: WakeLockHandle | null = null

    const releaseWakeLock = async () => {
      if (!wakeLock) return

      try {
        await wakeLock.release()
      } catch {
        // Ignore release failures, the browser may already have dropped the lock.
      } finally {
        wakeLock = null
      }
    }

    const acquireWakeLock = async () => {
      if (cancelled || document.visibilityState !== 'visible' || !isPwaStandalone()) {
        return
      }

      try {
        wakeLock = await (navigator as WakeLockNavigator).wakeLock?.request('screen') ?? null
      } catch {
        wakeLock = null
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void acquireWakeLock()
      } else {
        void releaseWakeLock()
      }
    }

    void acquireWakeLock()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handleVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handleVisibilityChange)
      void releaseWakeLock()
    }
  }, [])

  return null
}
