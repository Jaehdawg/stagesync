'use client'

import { useEffect, useMemo, useState } from 'react'

type WakeLockHandle = {
  release: () => Promise<void>
}

type WakeLockNavigator = Navigator & {
  standalone?: boolean
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockHandle>
  }
}

const STORAGE_KEY = 'stagesync:keep-awake-enabled'

function isPwaStandalone() {
  if (typeof window === 'undefined') return false

  const standaloneMedia = window.matchMedia?.('(display-mode: standalone)')?.matches ?? false
  const iosStandalone = (navigator as WakeLockNavigator).standalone === true

  return standaloneMedia || iosStandalone
}

function isIosDevice() {
  if (typeof navigator === 'undefined') return false

  const ua = navigator.userAgent ?? ''
  const platform = navigator.platform ?? ''
  const maxTouchPoints = (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints ?? 0
  return /iPad|iPhone|iPod/i.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1)
}

function readStoredPreference() {
  if (typeof window === 'undefined' || typeof window.localStorage?.getItem !== 'function') return true

  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === null ? true : stored === 'true'
}

export function PwaWakeLock() {
  const [enabled, setEnabled] = useState(readStoredPreference)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setEnabled(readStoredPreference())
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.localStorage?.setItem !== 'function') return
    window.localStorage.setItem(STORAGE_KEY, String(enabled))
  }, [enabled])

  const standalone = useMemo(() => isPwaStandalone(), [])
  const wakeLockSupported = useMemo(() => typeof navigator !== 'undefined' && 'wakeLock' in navigator, [])
  const needsVideoFallback = standalone && enabled && !wakeLockSupported && isIosDevice()

  useEffect(() => {
    if (!standalone || !enabled) {
      return
    }

    let cancelled = false
    let wakeLock: WakeLockHandle | null = null

    const releaseWakeLock = async () => {
      if (wakeLock) {
        try {
          await wakeLock.release()
        } catch {
          // Ignore release failures, the browser may already have dropped the lock.
        } finally {
          wakeLock = null
        }
      }
    }

    const releaseVideo = async () => {
      const video = document.querySelector<HTMLVideoElement>('[data-pwa-wake-lock-video="true"]')
      if (!video) return

      try {
        video.pause()
      } catch {
        // Ignore pause failures.
      }
    }

    const acquireWakeLock = async () => {
      if (cancelled || document.visibilityState !== 'visible' || !enabled) {
        return
      }

      if (wakeLockSupported) {
        try {
          wakeLock = await (navigator as WakeLockNavigator).wakeLock?.request('screen') ?? null
          return
        } catch {
          wakeLock = null
        }
      }

      if (needsVideoFallback) {
        const video = document.querySelector<HTMLVideoElement>('[data-pwa-wake-lock-video="true"]')
        if (!video) return

        try {
          await video.play()
        } catch {
          // iOS may reject autoplay until the next user interaction.
        }
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void acquireWakeLock()
      } else {
        void releaseWakeLock()
        void releaseVideo()
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
      void releaseVideo()
    }
  }, [standalone, enabled, needsVideoFallback, wakeLockSupported])

  if (!standalone) {
    return null
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setEnabled((value) => !value)}
        className="fixed bottom-4 right-4 z-50 rounded-full border border-white/15 bg-slate-950/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 shadow-lg shadow-black/30 backdrop-blur hover:border-cyan-400/50"
      >
        Keep awake: {enabled ? 'on' : 'off'}
      </button>
      {needsVideoFallback ? (
        <video
          data-pwa-wake-lock-video="true"
          src="/keep-awake.mp4"
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          aria-hidden="true"
          className="pointer-events-none fixed bottom-0 right-0 h-px w-px opacity-0"
        />
      ) : null}
    </>
  )
}
