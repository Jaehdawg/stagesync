import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getTestSessionMock = vi.fn()
const bandLookupMaybeSingleMock = vi.fn()
const profileLookupMaybeSingleMock = vi.fn()
const bandProfilesUpsertMock = vi.fn()
const bandRolesUpsertMock = vi.fn()
const bandsInsertSelectMaybeSingleMock = vi.fn()

function makeBuilder(maybeSingle: () => Promise<any>) {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    ilike: vi.fn(() => chain),
    maybeSingle,
    insert: vi.fn(() => ({ select: vi.fn(() => ({ maybeSingle: bandsInsertSelectMaybeSingleMock })) })),
    upsert: vi.fn(),
  }
  return chain
}

const createServiceClientMock = vi.fn(() => ({
  auth: {
    admin: {
      createUser: vi.fn(),
    },
  },
  from(table: string) {
    if (table === 'bands') {
      return makeBuilder(bandLookupMaybeSingleMock)
    }
    if (table === 'profiles') {
      return makeBuilder(profileLookupMaybeSingleMock)
    }
    if (table === 'band_profiles') {
      return {
        upsert: bandProfilesUpsertMock,
      }
    }
    if (table === 'band_roles') {
      return {
        upsert: bandRolesUpsertMock,
      }
    }
    return {}
  },
}))

vi.mock('../../../../lib/test-session', () => ({
  getTestSession: getTestSessionMock,
}))

vi.mock('../../../../utils/supabase/service', () => ({
  createServiceClient: createServiceClientMock,
}))

async function loadRoute() {
  return await import('./route')
}

beforeEach(() => {
  getTestSessionMock.mockReset()
  bandLookupMaybeSingleMock.mockReset()
  profileLookupMaybeSingleMock.mockReset()
  bandProfilesUpsertMock.mockReset()
  bandRolesUpsertMock.mockReset()
  bandsInsertSelectMaybeSingleMock.mockReset()
  createServiceClientMock.mockClear()
})

describe('admin bands route', () => {
  it('creates a live band profile and band role from an existing profile lookup', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'admin', username: 'stagesync-admin' })
    bandLookupMaybeSingleMock.mockResolvedValue({ data: { id: 'band-1', band_name: 'Finding North' }, error: null })
    profileLookupMaybeSingleMock.mockResolvedValue({ data: { id: 'profile-1' }, error: null })
    bandProfilesUpsertMock.mockResolvedValue({ error: null })
    bandRolesUpsertMock.mockResolvedValue({ error: null })

    const { POST } = await loadRoute()
    const request = {
      formData: async () => {
        const formData = new FormData()
        formData.set('action', 'create')
        formData.set('bandName', 'Finding North')
        formData.set('createMode', 'existing_profile')
        formData.set('profileLookup', 'profile-owner')
        formData.set('bandRole', 'admin')
        formData.set('customMessage', 'Welcome')
        return formData
      },
      url: 'https://example.com/api/admin/bands',
    } as unknown as NextRequest

    const response = await POST(request)

    expect(response.status).toBe(307)
    expect(bandProfilesUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        band_id: 'band-1',
        profile_id: 'profile-1',
        band_name: 'Finding North',
        custom_message: 'Welcome',
      }),
      { onConflict: 'band_id' }
    )
    expect(bandRolesUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        band_id: 'band-1',
        profile_id: 'profile-1',
        band_role: 'admin',
        active: true,
      }),
      { onConflict: 'band_id,profile_id' }
    )
  })
})
