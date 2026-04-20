import { fireEvent, render, waitFor } from '@testing-library/react'
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
  vi.restoreAllMocks()
  window.localStorage?.removeItem?.('stagesync:keep-awake-enabled')
})

describe('PwaWakeLock', () => {
  it('requests a screen wake lock only in standalone mode', async () => {
    const requestMock = vi.fn().mockResolvedValue({ release: vi.fn().mockResolvedValue(undefined) })
    vi.stubGlobal('navigator', {
      wakeLock: { request: requestMock },
      standalone: true,
      userAgent: 'Chrome',
      platform: 'MacIntel',
      maxTouchPoints: 0,
    })
    mockMatchMedia(true)

    render(<PwaWakeLock />)

    await waitFor(() => {
      expect(requestMock).toHaveBeenCalledWith('screen')
      expect(document.querySelector('button')).toHaveTextContent(/keep awake: on/i)
    })
  })

  it('toggles the wake lock off and on in standalone mode', async () => {
    const requestMock = vi.fn().mockResolvedValue({ release: vi.fn().mockResolvedValue(undefined) })
    vi.stubGlobal('navigator', {
      wakeLock: { request: requestMock },
      standalone: true,
      userAgent: 'Chrome',
      platform: 'MacIntel',
      maxTouchPoints: 0,
    })
    mockMatchMedia(true)

    render(<PwaWakeLock />)

    const toggle = await waitFor(() => document.querySelector('button'))
    expect(toggle).toHaveTextContent(/keep awake: on/i)

    fireEvent.click(toggle!)
    expect(toggle).toHaveTextContent(/keep awake: off/i)

    fireEvent.click(toggle!)
    await waitFor(() => {
      expect(requestMock).toHaveBeenCalledTimes(2)
      expect(toggle).toHaveTextContent(/keep awake: on/i)
    })
  })

  it('falls back to a looping video on iOS standalone when Wake Lock is unavailable', async () => {
    const playMock = vi.fn().mockResolvedValue(undefined)
    const pauseMock = vi.fn()
    vi.stubGlobal('navigator', {
      standalone: true,
      userAgent: 'iPhone',
      platform: 'iPhone',
      maxTouchPoints: 1,
    })
    mockMatchMedia(true)
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(playMock)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pauseMock)

    const { container } = render(<PwaWakeLock />)

    await waitFor(() => {
      expect(container.querySelector('video')).not.toBeNull()
      expect(playMock).toHaveBeenCalled()
    })
  })

  it('does nothing in a normal browser tab', async () => {
    const requestMock = vi.fn()
    vi.stubGlobal('navigator', {
      wakeLock: { request: requestMock },
      standalone: false,
      userAgent: 'Chrome',
      platform: 'MacIntel',
      maxTouchPoints: 0,
    })
    mockMatchMedia(false)

    render(<PwaWakeLock />)

    await waitFor(() => {
      expect(requestMock).not.toHaveBeenCalled()
      expect(document.querySelector('button')).toBeNull()
    })
  })
})
