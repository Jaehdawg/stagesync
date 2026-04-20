'use client'

import { useEffect, useRef, useState } from 'react'

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

function isIosDevice() {
  if (typeof navigator === 'undefined') return false

  const ua = navigator.userAgent ?? ''
  const platform = navigator.platform ?? ''
  return /iPad|iPhone|iPod/i.test(ua) || (platform === 'MacIntel' && (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints > 1)
}

export function PwaWakeLock() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [useVideoFallback, setUseVideoFallback] = useState(false)

  useEffect(() => {
    if (!isPwaStandalone()) {
      return
    }

    const wakeLockSupported = 'wakeLock' in navigator
    const iosFallback = !wakeLockSupported && isIosDevice()
    if (iosFallback) {
      setUseVideoFallback(true)
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

      const video = videoRef.current
      if (video) {
        try {
          video.pause()
        } catch {
          // Ignore pause failures.
        }
      }
    }

    const acquireWakeLock = async () => {
      if (cancelled || document.visibilityState !== 'visible' || !isPwaStandalone()) {
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

      if (iosFallback || useVideoFallback) {
        const video = videoRef.current
        if (!video) return

        setUseVideoFallback(true)
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
  }, [useVideoFallback])

  if (!useVideoFallback) {
    return null
  }

  return (
    <video
      ref={videoRef}
      src="/keep-awake.mp4"
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      aria-hidden="true"
      className="pointer-events-none fixed bottom-0 right-0 h-px w-px opacity-0"
    />
  )
}
