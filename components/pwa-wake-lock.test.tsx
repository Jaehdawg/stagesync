import { render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PwaWakeLock } from './pwa-wake-lock'

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches,
    media: '(display-mode: standalone)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('PwaWakeLock', () => {
  it('requests a screen wake lock only in standalone mode', async () => {
    const requestMock = vi.fn().mockResolvedValue({ release: vi.fn().mockResolvedValue(undefined) })
    vi.stubGlobal('navigator', {
      wakeLock: { request: requestMock },
      standalone: true,
    })
    mockMatchMedia(true)

    render(<PwaWakeLock />)

    await waitFor(() => {
      expect(requestMock).toHaveBeenCalledWith('screen')
    })
  })

  it('does nothing in a normal browser tab', async () => {
    const requestMock = vi.fn()
    vi.stubGlobal('navigator', {
      wakeLock: { request: requestMock },
      standalone: false,
    })
    mockMatchMedia(false)

    render(<PwaWakeLock />)

    await waitFor(() => {
      expect(requestMock).not.toHaveBeenCalled()
    })
  })
})
