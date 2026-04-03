import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getTestSessionMock = vi.fn()
const getLiveBandAccessContextMock = vi.fn()
const createServerClientMock = vi.fn(() => ({
  auth: { getUser: vi.fn() },
}))
const songsUpdateEqMock = vi.fn()
const songsUpdateIsMock = vi.fn()
const songsUpdateMock = vi.fn(() => ({
  eq: songsUpdateEqMock,
}))
const createServiceClientMock = vi.fn(() => ({
  from: vi.fn((table: string) => {
    if (table === 'songs') {
      return {
        upsert: vi.fn(() => ({ error: null })),
        update: songsUpdateMock,
      }
    }
    return {}
  }),
}))

songsUpdateEqMock.mockImplementation(() => ({ is: songsUpdateIsMock }))
songsUpdateIsMock.mockResolvedValue({ error: null })

vi.mock('@supabase/ssr', () => ({
  createServerClient: createServerClientMock,
}))

vi.mock('../../../../utils/supabase/service', () => ({
  createServiceClient: createServiceClientMock,
}))

vi.mock('../../../../lib/test-session', () => ({
  getTestSession: getTestSessionMock,
}))

vi.mock('../../../../lib/band-access', () => ({
  getLiveBandAccessContext: getLiveBandAccessContextMock,
}))

async function loadRoute() {
  return await import('./route')
}

function makeRequest(formData: FormData) {
  return {
    formData: async () => formData,
    url: 'https://example.com/api/band/songs',
  } as unknown as NextRequest
}

beforeEach(() => {
  getTestSessionMock.mockReset()
  getLiveBandAccessContextMock.mockReset()
  createServerClientMock.mockReset()
  createServiceClientMock.mockClear()
  songsUpdateMock.mockClear()
  songsUpdateEqMock.mockClear()
  songsUpdateIsMock.mockClear()
})

describe('band songs api route', () => {
  it('archives all current-band songs when asked to delete all', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', username: 'stagesync-band', activeBandId: 'band-1' })

    const { POST } = await loadRoute()
    const formData = new FormData()
    formData.set('action', 'delete-all')

    const response = await POST(makeRequest(formData))

    expect(response.status).toBe(303)
    expect(songsUpdateMock).toHaveBeenCalledWith({ archived_at: expect.any(String) })
    expect(songsUpdateEqMock).toHaveBeenCalledWith('band_id', 'band-1')
    expect(songsUpdateIsMock).toHaveBeenCalledWith('archived_at', null)
  })
})
