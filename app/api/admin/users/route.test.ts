import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getTestSessionMock = vi.fn()
const getRequestAdminAccessMock = vi.fn()
const createUserMock = vi.fn()
const profileUpsertMock = vi.fn()
const bandUpsertMock = vi.fn()
const profilesSelectMaybeSingleMock = vi.fn()
const bandsSelectMaybeSingleMock = vi.fn()
const bandRoleUpsertMock = vi.fn()
const profileDeleteMock = vi.fn()
const authDeleteUserMock = vi.fn()

function makeChain(maybeSingle: () => Promise<any>) {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    ilike: vi.fn(() => chain),
    or: vi.fn(() => chain),
    in: vi.fn(() => chain),
    order: vi.fn(() => chain),
    range: vi.fn(() => chain),
    maybeSingle,
    upsert: profileUpsertMock,
    delete: vi.fn(() => ({ eq: profileDeleteMock })),
    update: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })),
  }
  return chain
}

const createServiceClientMock = vi.fn(() => ({
  auth: {
    admin: {
      createUser: createUserMock,
      deleteUser: authDeleteUserMock,
    },
  },
  from(table: string) {
    if (table === 'profiles') {
      return makeChain(profilesSelectMaybeSingleMock)
    }
    if (table === 'bands') {
      return makeChain(bandsSelectMaybeSingleMock)
    }
    if (table === 'band_roles') {
      return {
        upsert: bandRoleUpsertMock,
        delete: () => ({ eq: vi.fn(() => ({ eq: vi.fn() })) }),
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

vi.mock('../../../../lib/admin-access', () => ({
  getRequestAdminAccess: getRequestAdminAccessMock,
}))

async function loadRoute() {
  return await import('./route')
}

beforeEach(() => {
  getTestSessionMock.mockReset()
  getRequestAdminAccessMock.mockReset()
  createUserMock.mockReset()
  profileUpsertMock.mockReset()
  profilesSelectMaybeSingleMock.mockReset()
  bandsSelectMaybeSingleMock.mockReset()
  bandRoleUpsertMock.mockReset()
  profileDeleteMock.mockReset()
  authDeleteUserMock.mockReset()
  createServiceClientMock.mockClear()
  getRequestAdminAccessMock.mockResolvedValue({ source: 'live', username: 'stagesync-admin', userId: 'admin-1' })
})

describe('admin users route', () => {

  it('creates a new band member user with a member band role', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'admin', username: 'stagesync-admin' })
    bandsSelectMaybeSingleMock.mockResolvedValue({ data: { id: 'band-1' }, error: null })
    profilesSelectMaybeSingleMock.mockResolvedValue({ data: null, error: null })
    profileUpsertMock.mockResolvedValue({ error: null })
    createUserMock.mockResolvedValue({ data: { user: { id: 'user-2' } }, error: null })
    bandRoleUpsertMock.mockResolvedValue({ error: null })

    const { POST } = await loadRoute()
    const formData = new FormData()
    formData.set('action', 'create')
    formData.set('createMode', 'new_user')
    formData.set('firstName', 'Bea')
    formData.set('lastName', 'Martinez')
    formData.set('email', 'bea@example.com')
    formData.set('password', 'Password1')
    formData.set('username', 'bea')
    formData.set('role', 'band')
    formData.set('bandLookup', 'Finding North')
    formData.set('bandRole', 'member')

    const request = {
      formData: async () => formData,
      url: 'https://example.com/api/admin/users',
    } as unknown as NextRequest

    const response = await POST(request)

    expect(response.status).toBe(307)
    expect(createUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'bea@example.com',
        password: 'Password1',
        email_confirm: true,
      })
    )
    expect(bandRoleUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        band_id: 'band-1',
        profile_id: 'user-2',
        band_role: 'member',
        active: true,
      }),
      { onConflict: 'band_id,profile_id' }
    )
  })
  it('creates a new auth user, profile, and band role', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'admin', username: 'stagesync-admin' })
    bandsSelectMaybeSingleMock.mockResolvedValue({ data: { id: 'band-1' }, error: null })
    profilesSelectMaybeSingleMock.mockResolvedValue({ data: null, error: null })
    profileUpsertMock.mockResolvedValue({ error: null })
    createUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    bandRoleUpsertMock.mockResolvedValue({ error: null })

    const { POST } = await loadRoute()
    const formData = new FormData()
    formData.set('action', 'create')
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
      url: 'https://example.com/api/admin/users',
    } as unknown as NextRequest

    const response = await POST(request)

    expect(response.status).toBe(307)
    expect(createUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'avery@example.com',
        password: 'Password1',
        email_confirm: true,
      })
    )
    expect(bandRoleUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        band_id: 'band-1',
        profile_id: 'user-1',
        band_role: 'admin',
        active: true,
      }),
      { onConflict: 'band_id,profile_id' }
    )
  })
})
