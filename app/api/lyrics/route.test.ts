import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

async function loadRoute() {
  return await import('./route')
}

describe('lyrics route', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns cached lyrics when available', async () => {
    const { GET } = await loadRoute()
    const request = { nextUrl: new URL('https://example.com/api/lyrics?artist=Adele&title=Hello') } as NextRequest

    // prime the cache through a successful fetch
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ lyrics: 'Hello from cache' }), { status: 200 })))
    const first = await GET(request)
    expect(first.status).toBe(200)
    expect(await first.json()).toEqual({ lyrics: 'Hello from cache', cached: false })

    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('should not call fetch for cached response') }))
    const second = await GET(request)
    expect(second.status).toBe(200)
    expect(await second.json()).toEqual({ lyrics: 'Hello from cache', cached: true })
  })

  it('aborts a slow upstream lyrics fetch', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn((_url, init) => new Promise((_resolve, reject) => {
      const signal = (init as RequestInit | undefined)?.signal as AbortSignal | undefined
      signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    })))

    const { GET } = await loadRoute()
    const request = { nextUrl: new URL('https://example.com/api/lyrics?artist=Taylor%20Swift&title=Anti-Hero') } as NextRequest

    const responsePromise = GET(request)
    await vi.advanceTimersByTimeAsync(8_000)
    const response = await responsePromise
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ lyrics: '', cached: false })
    vi.useRealTimers()
  })
})
