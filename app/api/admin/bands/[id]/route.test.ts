import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getTestSessionMock = vi.fn()
const deleteEqMock = vi.fn(() => ({ error: null }))
const updateEqMock = vi.fn(() => ({ error: null }))
const bandUpdateMock = vi.fn(() => ({ eq: updateEqMock }))
const bandDeleteMock = vi.fn(() => ({ eq: deleteEqMock }))
const genericDeleteMock = vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) }))

const createServiceClientMock = vi.fn(() => ({
  from(table: string) {
    if (table === 'bands') {
      return {
        update: bandUpdateMock,
        delete: bandDeleteMock,
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
  createServiceClientMock.mockClear()
})

describe('admin band id route', () => {
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
