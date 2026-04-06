import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const getTestSessionMock = vi.fn()
const getTestLoginMock = vi.fn()
const getLiveBandAccessContextMock = vi.fn()
const createServiceClientMock = vi.fn()
const createServerClientMock = vi.fn(() => ({
  cookies: {
    getAll: () => [],
    setAll: vi.fn(),
  },
}))

vi.mock('../../../../lib/test-session', () => ({
  getTestSession: getTestSessionMock,
}))
vi.mock('../../../../lib/test-login-list', () => ({
  getTestLogin: getTestLoginMock,
}))
vi.mock('../../../../lib/band-access', () => ({
  getLiveBandAccessContext: getLiveBandAccessContextMock,
}))
vi.mock('@supabase/ssr', () => ({
  createServerClient: createServerClientMock,
}))
vi.mock('../../../../utils/supabase/service', () => ({
  createServiceClient: createServiceClientMock,
}))

async function loadRoute() {
  return await import('./route')
}

beforeEach(() => {
  getTestSessionMock.mockReset()
  getTestLoginMock.mockReset()
  getLiveBandAccessContextMock.mockReset()
  createServiceClientMock.mockReset()
  createServerClientMock.mockClear()
  createServiceClientMock.mockReturnValue({})
})

describe('billing config route', () => {
  it('returns stripe readiness for band admins', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', username: 'northside' })
    getTestLoginMock.mockResolvedValue({ role: 'band', band_access_level: 'admin' })
    getLiveBandAccessContextMock.mockResolvedValue(null)

    const { GET } = await loadRoute()
    const request = { cookies: { getAll: () => [], set: vi.fn() } } as unknown as NextRequest

    const response = await GET(request)
    expect(response.status).toBe(200)
  })

  it('rejects non-admin access', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', username: 'northside' })
    getTestLoginMock.mockResolvedValue({ role: 'band', band_access_level: 'member' })
    getLiveBandAccessContextMock.mockResolvedValue(null)

    const { GET } = await loadRoute()
    const request = { cookies: { getAll: () => [], set: vi.fn() } } as unknown as NextRequest

    const response = await GET(request)
    expect(response.status).toBe(403)
  })
})
