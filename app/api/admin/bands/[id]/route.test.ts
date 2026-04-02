import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getTestSessionMock = vi.fn()
const deleteEqMock = vi.fn(() => ({ error: null }))
const updateEqMock = vi.fn(() => ({ error: null }))
const bandUpdateMock = vi.fn(() => ({ eq: updateEqMock }))
const bandDeleteMock = vi.fn(() => ({ eq: deleteEqMock }))
const genericDeleteMock = vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) }))
const bandProfilesSelectMaybeSingleMock = vi.fn()
const bandRolesSelectMaybeSingleMock = vi.fn()
const bandProfilesUpsertMock = vi.fn()

const createServiceClientMock = vi.fn(() => ({
  from(table: string) {
    if (table === 'bands') {
      return {
        update: bandUpdateMock,
        delete: bandDeleteMock,
      }
    }
    if (table === 'band_profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: bandProfilesSelectMaybeSingleMock })),
        })),
        upsert: bandProfilesUpsertMock,
        delete: genericDeleteMock,
      }
    }
    if (table === 'band_roles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: bandRolesSelectMaybeSingleMock })) })) })),
        })),
        delete: genericDeleteMock,
      }
    }
    return {
      delete: genericDeleteMock,
    }
  },
}))

vi.mock('../../../../../lib/test-session', () => ({
  getTestSession: getTestSessionMock,
}))

vi.mock('../../../../../utils/supabase/service', () => ({
  createServiceClient: createServiceClientMock,
}))

async function loadRoute() {
  return await import('./route')
}

beforeEach(() => {
  getTestSessionMock.mockReset()
  deleteEqMock.mockReset()
  updateEqMock.mockReset()
  bandUpdateMock.mockClear()
  bandDeleteMock.mockClear()
  genericDeleteMock.mockClear()
  bandProfilesSelectMaybeSingleMock.mockReset()
  bandRolesSelectMaybeSingleMock.mockReset()
  bandProfilesUpsertMock.mockReset()
  createServiceClientMock.mockClear()
})

describe('admin band id route', () => {
  it('updates a band profile using the stored live profile owner', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'admin', username: 'stagesync-admin' })
    bandProfilesSelectMaybeSingleMock.mockResolvedValue({ data: { profile_id: 'profile-1' }, error: null })
    bandProfilesUpsertMock.mockResolvedValue({ error: null })

    const { POST } = await loadRoute()
    const request = {
      formData: async () => {
        const formData = new FormData()
        formData.set('action', 'update')
        formData.set('bandName', 'Finding North')
        formData.set('customMessage', 'Updated')
        return formData
      },
      url: 'https://example.com/api/admin/bands/band-1',
    } as unknown as NextRequest

    const response = await POST(request, { params: Promise.resolve({ id: 'band-1' }) })

    expect(response.status).toBe(307)
    expect(bandProfilesUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        band_id: 'band-1',
        profile_id: 'profile-1',
        band_name: 'Finding North',
        custom_message: 'Updated',
      }),
      { onConflict: 'band_id' }
    )
  })

  it('deletes a band and its associated band data', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'admin', username: 'stagesync-admin' })

    const { POST } = await loadRoute()
    const request = {
      formData: async () => {
        const formData = new FormData()
        formData.set('action', 'delete')
        return formData
      },
      url: 'https://example.com/api/admin/bands/band-1',
    } as unknown as NextRequest

    const response = await POST(request, { params: Promise.resolve({ id: 'band-1' }) })

    expect(response.status).toBe(307)
    expect(bandDeleteMock).toHaveBeenCalled()
    expect(deleteEqMock).toHaveBeenCalledWith('id', 'band-1')
  })
})
