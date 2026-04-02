import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getTestSessionMock = vi.fn()
const bandLookupMaybeSingleMock = vi.fn()
const profileLookupMaybeSingleMock = vi.fn()
const bandProfilesUpsertMock = vi.fn()
const bandRolesUpsertMock = vi.fn()
const bandsInsertSelectMaybeSingleMock = vi.fn()
const bandsDeleteEqMock = vi.fn()
const profilesDeleteEqMock = vi.fn()
const bandProfilesDeleteEqMock = vi.fn()
const bandRolesDeleteEqMock = vi.fn()
const authCreateUserMock = vi.fn()
const authDeleteUserMock = vi.fn()

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
      createUser: authCreateUserMock,
      deleteUser: authDeleteUserMock,
    },
  },
  from(table: string) {
    if (table === 'bands') {
      return {
        ...makeBuilder(bandLookupMaybeSingleMock),
        delete: vi.fn(() => ({ eq: bandsDeleteEqMock })),
      }
    }
    if (table === 'profiles') {
      return {
        ...makeBuilder(profileLookupMaybeSingleMock),
        delete: vi.fn(() => ({ eq: profilesDeleteEqMock })),
      }
    }
    if (table === 'band_profiles') {
      return {
        upsert: bandProfilesUpsertMock,
        delete: vi.fn(() => ({ eq: bandProfilesDeleteEqMock })),
      }
    }
    if (table === 'band_roles') {
      return {
        upsert: bandRolesUpsertMock,
        delete: vi.fn(() => ({ eq: bandRolesDeleteEqMock })),
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
  bandsDeleteEqMock.mockReset()
  profilesDeleteEqMock.mockReset()
  bandProfilesDeleteEqMock.mockReset()
  bandRolesDeleteEqMock.mockReset()
  authCreateUserMock.mockReset()
  authDeleteUserMock.mockReset()
  createServiceClientMock.mockClear()
})

describe('admin bands route', () => {

  it('rolls back a newly created band when the role creation fails', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'admin', username: 'stagesync-admin' })
    bandLookupMaybeSingleMock.mockResolvedValue({ data: null, error: null })
    authCreateUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    bandsInsertSelectMaybeSingleMock.mockResolvedValue({ data: { id: 'band-1', band_name: 'Finding North' }, error: null })
    profileLookupMaybeSingleMock.mockResolvedValue({ data: null, error: null })
    bandProfilesUpsertMock.mockResolvedValue({ error: null })
    bandRolesUpsertMock.mockResolvedValue({ error: { message: 'band role insert failed' } })
    bandsDeleteEqMock.mockResolvedValue({ error: null })
    bandProfilesDeleteEqMock.mockResolvedValue({ error: null })
    bandRolesDeleteEqMock.mockResolvedValue({ error: null })
    profilesDeleteEqMock.mockResolvedValue({ error: null })
    authDeleteUserMock.mockResolvedValue({ error: null })

    const { POST } = await loadRoute()
    const formData = new FormData()
    formData.set('action', 'create')
    formData.set('bandName', 'Finding North')
    formData.set('createMode', 'new_user')
    formData.set('firstName', 'Avery')
    formData.set('lastName', 'Lee')
    formData.set('email', 'avery@example.com')
    formData.set('password', 'Password1')
    formData.set('username', 'avery')
    formData.set('role', 'band')
    formData.set('bandLookup', 'Finding North')
    formData.set('bandRole', 'admin')

    const request = {
      formData: async () => formData,
      url: 'https://example.com/api/admin/bands',
    } as unknown as NextRequest

    const response = await POST(request)

    expect(response.status).toBe(500)
    expect(authDeleteUserMock).toHaveBeenCalledWith('user-1')
    expect(profilesDeleteEqMock).toHaveBeenCalledWith('id', 'user-1')
    expect(bandRolesDeleteEqMock).toHaveBeenCalledWith('band_id', 'band-1')
    expect(bandProfilesDeleteEqMock).toHaveBeenCalledWith('band_id', 'band-1')
    expect(bandsDeleteEqMock).toHaveBeenCalledWith('id', 'band-1')
  })
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
