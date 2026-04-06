import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const insertMock = vi.fn()
const createServiceClientMock = vi.fn(() => ({
  from: vi.fn(() => ({ insert: insertMock })),
}))

vi.mock('@/utils/supabase/service', () => ({
  createServiceClient: createServiceClientMock,
}))

async function loadRoute() {
  return await import('./route')
}

beforeEach(() => {
  insertMock.mockReset()
  insertMock.mockResolvedValue({ error: null })
  createServiceClientMock.mockClear()
})

describe('analytics redirect route', () => {
  it('logs the click event and redirects to the target path', async () => {
    const { GET } = await loadRoute()
    const request = {
      nextUrl: new URL('https://example.com/api/analytics/redirect?eventName=trial.started&source=homepage.hero.start-free-trial&next=/band'),
      url: 'https://example.com/api/analytics/redirect?eventName=trial.started&source=homepage.hero.start-free-trial&next=/band',
    } as unknown as NextRequest

    const response = await GET(request)

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('https://example.com/band')
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      event_name: 'trial.started',
      source: 'homepage.hero.start-free-trial',
      properties: { next: '/band' },
    }))
  })
})
