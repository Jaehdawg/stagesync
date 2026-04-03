import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getTestSessionMock = vi.fn()
const getTestLoginMock = vi.fn()
const getLiveBandAccessContextMock = vi.fn()
const listBandSetListsMock = vi.fn()
const createBandSetListMock = vi.fn()
const createServerClientMock = vi.fn(() => ({
  auth: { getUser: vi.fn() },
}))
const createServiceClientMock = vi.fn(() => ({}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: createServerClientMock,
}))

vi.mock('../../../../utils/supabase/service', () => ({
  createServiceClient: createServiceClientMock,
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

vi.mock('../../../../lib/set-lists', () => ({
  listBandSetLists: listBandSetListsMock,
  createBandSetList: createBandSetListMock,
}))

function makeRequest(formData: FormData) {
  return {
    formData: async () => formData,
    url: 'https://example.com/api/band/set-lists',
  } as unknown as NextRequest
}

async function loadRoute() {
  return await import('./route')
}

beforeEach(() => {
  getTestSessionMock.mockReset()
  getTestLoginMock.mockReset()
  getLiveBandAccessContextMock.mockReset()
  listBandSetListsMock.mockReset()
  createBandSetListMock.mockReset()
  createServerClientMock.mockReset()
  createServiceClientMock.mockReset()
})

describe('band set-lists api route', () => {
  it('rejects requests without band-admin access', async () => {
    getTestSessionMock.mockResolvedValue(null)
    getLiveBandAccessContextMock.mockResolvedValue(null)

    const { GET } = await loadRoute()
    const response = await GET(makeRequest(new FormData()))

    expect(response.status).toBe(403)
  })

  it('lists set lists for an admin band session', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', username: 'stagesync-band', activeBandId: 'band-1' })
    getTestLoginMock.mockResolvedValue({ role: 'band', band_access_level: 'admin', active_band_id: 'band-1' })
    listBandSetListsMock.mockResolvedValue([{ id: 'set-1', band_id: 'band-1', name: 'Friday Set' }])

    const { GET } = await loadRoute()
    const response = await GET(makeRequest(new FormData()))
    const payload = (await response.json()) as { setLists: unknown[] }

    expect(response.status).toBe(200)
    expect(payload.setLists).toHaveLength(1)
    expect(listBandSetListsMock).toHaveBeenCalledWith('band-1')
  })

  it('creates a new set list with normalized song ids', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', username: 'stagesync-band', activeBandId: 'band-1' })
    getTestLoginMock.mockResolvedValue({ role: 'band', band_access_level: 'admin', active_band_id: 'band-1' })
    createBandSetListMock.mockResolvedValue({ id: 'set-1' })

    const { POST } = await loadRoute()
    const formData = new FormData()
    formData.set('name', 'Friday Set')
    formData.set('description', 'Best songs')
    formData.set('notes', 'Bring the energy')
    formData.set('songIds', 'song-1, song-2\n song-2\n')

    const response = await POST(makeRequest(formData))

    expect(response.status).toBe(303)
    expect(createBandSetListMock).toHaveBeenCalledWith('band-1', {
      name: 'Friday Set',
      description: 'Best songs',
      notes: 'Bring the energy',
      is_active: false,
      songIds: ['song-1', 'song-2'],
    })
  })
})
