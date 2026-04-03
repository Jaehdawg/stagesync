import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getTestSessionMock = vi.fn()
const getTestLoginMock = vi.fn()
const getLiveBandAccessContextMock = vi.fn()
const activateBandSetListMock = vi.fn()
const copyBandSetListMock = vi.fn()
const deactivateBandSetListMock = vi.fn()
const deleteBandSetListMock = vi.fn()
const moveBandSetListSongMock = vi.fn()
const removeBandSetListSongMock = vi.fn()
const updateBandSetListMock = vi.fn()
const createServerClientMock = vi.fn(() => ({
  auth: { getUser: vi.fn() },
}))
const createServiceClientMock = vi.fn(() => ({}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: createServerClientMock,
}))

vi.mock('../../../../../utils/supabase/service', () => ({
  createServiceClient: createServiceClientMock,
}))

vi.mock('../../../../../lib/test-session', () => ({
  getTestSession: getTestSessionMock,
}))

vi.mock('../../../../../lib/test-login-list', () => ({
  getTestLogin: getTestLoginMock,
}))

vi.mock('../../../../../lib/band-access', () => ({
  getLiveBandAccessContext: getLiveBandAccessContextMock,
}))

vi.mock('../../../../../lib/set-lists', () => ({
  activateBandSetList: activateBandSetListMock,
  copyBandSetList: copyBandSetListMock,
  deactivateBandSetList: deactivateBandSetListMock,
  deleteBandSetList: deleteBandSetListMock,
  moveBandSetListSong: moveBandSetListSongMock,
  removeBandSetListSong: removeBandSetListSongMock,
  updateBandSetList: updateBandSetListMock,
}))

function makeRequest(formData: FormData) {
  return {
    formData: async () => formData,
    url: 'https://example.com/api/band/set-lists/set-1',
  } as unknown as NextRequest
}

async function loadRoute() {
  return await import('./route')
}

beforeEach(() => {
  getTestSessionMock.mockReset()
  getTestLoginMock.mockReset()
  getLiveBandAccessContextMock.mockReset()
  activateBandSetListMock.mockReset()
  copyBandSetListMock.mockReset()
  deactivateBandSetListMock.mockReset()
  deleteBandSetListMock.mockReset()
  moveBandSetListSongMock.mockReset()
  removeBandSetListSongMock.mockReset()
  updateBandSetListMock.mockReset()
  createServerClientMock.mockReset()
  createServiceClientMock.mockReset()
})

describe('band set-lists [id] api route', () => {
  it('rejects requests without band-admin access', async () => {
    getTestSessionMock.mockResolvedValue(null)
    getLiveBandAccessContextMock.mockResolvedValue(null)

    const { POST } = await loadRoute()
    const response = await POST(makeRequest(new FormData()), { params: Promise.resolve({ id: 'set-1' }) })

    expect(response.status).toBe(403)
  })

  it('copies an active set list', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', username: 'stagesync-band', activeBandId: 'band-1' })
    getTestLoginMock.mockResolvedValue({ role: 'band', band_access_level: 'admin', active_band_id: 'band-1' })
    copyBandSetListMock.mockResolvedValue({ id: 'copy-1' })

    const { POST } = await loadRoute()
    const formData = new FormData()
    formData.set('action', 'copy')
    formData.set('name', 'Friday Set Copy')

    const response = await POST(makeRequest(formData), { params: Promise.resolve({ id: 'set-1' }) })

    expect(response.status).toBe(303)
    expect(copyBandSetListMock).toHaveBeenCalledWith('band-1', 'set-1', 'Friday Set Copy')
  })

  it('updates set list songs and metadata with normalized ids', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', username: 'stagesync-band', activeBandId: 'band-1' })
    getTestLoginMock.mockResolvedValue({ role: 'band', band_access_level: 'admin', active_band_id: 'band-1' })
    updateBandSetListMock.mockResolvedValue({ id: 'set-1' })

    const { POST } = await loadRoute()
    const formData = new FormData()
    formData.set('name', 'Friday Set')
    formData.set('description', 'Main show')
    formData.set('notes', 'Keep it moving')
    formData.set('songIds', 'song-1\n song-2, song-2')

    const response = await POST(makeRequest(formData), { params: Promise.resolve({ id: 'set-1' }) })

    expect(response.status).toBe(303)
    expect(updateBandSetListMock).toHaveBeenCalledWith('band-1', 'set-1', {
      name: 'Friday Set',
      description: 'Main show',
      notes: 'Keep it moving',
      songIds: ['song-1', 'song-2'],
    })
  })

  it('activates and deactivates set lists', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', username: 'stagesync-band', activeBandId: 'band-1' })
    getTestLoginMock.mockResolvedValue({ role: 'band', band_access_level: 'admin', active_band_id: 'band-1' })
    activateBandSetListMock.mockResolvedValue({ id: 'set-1' })
    deactivateBandSetListMock.mockResolvedValue({ id: 'set-1' })

    const { POST } = await loadRoute()

    const activateForm = new FormData()
    activateForm.set('action', 'activate')
    await POST(makeRequest(activateForm), { params: Promise.resolve({ id: 'set-1' }) })
    expect(activateBandSetListMock).toHaveBeenCalledWith('band-1', 'set-1')

    const deactivateForm = new FormData()
    deactivateForm.set('action', 'deactivate')
    await POST(makeRequest(deactivateForm), { params: Promise.resolve({ id: 'set-1' }) })
    expect(deactivateBandSetListMock).toHaveBeenCalledWith('band-1', 'set-1')
  })

  it('deletes a set list', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', username: 'stagesync-band', activeBandId: 'band-1' })
    getTestLoginMock.mockResolvedValue({ role: 'band', band_access_level: 'admin', active_band_id: 'band-1' })
    deleteBandSetListMock.mockResolvedValue(undefined)

    const { POST } = await loadRoute()
    const formData = new FormData()
    formData.set('action', 'delete')

    const response = await POST(makeRequest(formData), { params: Promise.resolve({ id: 'set-1' }) })

    expect(response.status).toBe(303)
    expect(deleteBandSetListMock).toHaveBeenCalledWith('band-1', 'set-1')
  })

  it('removes a song from a set list', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', username: 'stagesync-band', activeBandId: 'band-1' })
    getTestLoginMock.mockResolvedValue({ role: 'band', band_access_level: 'admin', active_band_id: 'band-1' })
    removeBandSetListSongMock.mockResolvedValue([{ id: 'row-1' }])

    const { POST } = await loadRoute()
    const formData = new FormData()
    formData.set('action', 'remove-song')
    formData.set('songId', 'song-3')

    const response = await POST(makeRequest(formData), { params: Promise.resolve({ id: 'set-1' }) })

    expect(response.status).toBe(303)
    expect(removeBandSetListSongMock).toHaveBeenCalledWith('band-1', 'set-1', 'song-3')
  })

  it('moves a song up or down in a set list', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', username: 'stagesync-band', activeBandId: 'band-1' })
    getTestLoginMock.mockResolvedValue({ role: 'band', band_access_level: 'admin', active_band_id: 'band-1' })
    moveBandSetListSongMock.mockResolvedValue([{ id: 'row-1' }])

    const { POST } = await loadRoute()
    const formData = new FormData()
    formData.set('action', 'move-up')
    formData.set('songId', 'song-3')

    const response = await POST(makeRequest(formData), { params: Promise.resolve({ id: 'set-1' }) })

    expect(response.status).toBe(303)
    expect(moveBandSetListSongMock).toHaveBeenCalledWith('band-1', 'set-1', 'song-3', 'up')
  })
})
