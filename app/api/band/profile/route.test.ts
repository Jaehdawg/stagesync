import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getTestSessionMock = vi.fn()
const getLiveBandAccessContextMock = vi.fn()
const encryptTidalCredentialMock = vi.fn((value: string) => `enc:${value}`)
const createServerClientMock = vi.fn(() => ({
  auth: { getUser: vi.fn() },
}))
const bandUpdateEqMock = vi.fn()
const bandUpdateMock = vi.fn(() => ({ eq: bandUpdateEqMock }))
const bandProfilesSelectMock = vi.fn()
const bandProfilesUpsertMock = vi.fn()

const createServiceClientMock = vi.fn(() => ({
  from: vi.fn((table: string) => {
    if (table === 'bands') {
      return { update: bandUpdateMock }
    }

    if (table === 'band_profiles') {
      return {
        select: bandProfilesSelectMock,
        upsert: bandProfilesUpsertMock,
      }
    }

    throw new Error(`Unexpected table: ${table}`)
  }),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: createServerClientMock,
}))

vi.mock('@/utils/supabase/service', () => ({
  createServiceClient: createServiceClientMock,
}))

vi.mock('@/lib/test-session', () => ({
  getTestSession: getTestSessionMock,
}))

vi.mock('@/lib/band-access', () => ({
  getLiveBandAccessContext: getLiveBandAccessContextMock,
}))

vi.mock('@/lib/tidal-credentials', () => ({
  encryptTidalCredential: encryptTidalCredentialMock,
}))

async function loadRoute() {
  return await import('./route')
}

function makeRequest(formData: Record<string, string>) {
  const form = new FormData()
  for (const [key, value] of Object.entries(formData)) {
    form.append(key, value)
  }

  return {
    formData: async () => form,
    cookies: {
      getAll: () => [],
      set: vi.fn(),
    },
    url: 'https://example.com/api/band/profile',
  } as unknown as NextRequest
}

beforeEach(() => {
  getTestSessionMock.mockReset()
  getLiveBandAccessContextMock.mockReset()
  encryptTidalCredentialMock.mockClear()
  createServerClientMock.mockClear()
  createServiceClientMock.mockClear()
  bandUpdateMock.mockReset()
  bandUpdateEqMock.mockReset()
  bandProfilesSelectMock.mockReset()
  bandProfilesUpsertMock.mockReset()
})

describe('band profile route', () => {
  it('encrypts a new tidal secret before saving', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', activeBandId: 'band-1', username: 'band-admin' })
    bandUpdateEqMock.mockResolvedValue({ error: null })
    bandProfilesSelectMock.mockReturnValue({ eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { tidal_client_secret: null }, error: null }) })) })
    bandProfilesUpsertMock.mockResolvedValue({ error: null })

    const { POST } = await loadRoute()
    const response = await POST(makeRequest({
      bandName: 'Finding North',
      tidalClientId: 'client-id',
      tidalClientSecret: 'client-secret',
    }))

    expect(response.status).toBe(307)
    expect(encryptTidalCredentialMock).toHaveBeenCalledWith('client-secret')
    expect(bandProfilesUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tidal_client_id: 'client-id',
        tidal_client_secret: 'enc:client-secret',
      }),
      { onConflict: 'band_id' }
    )
  })

  it('keeps the current encrypted secret when the field is left blank', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', activeBandId: 'band-1', username: 'band-admin' })
    bandUpdateEqMock.mockResolvedValue({ error: null })
    bandProfilesSelectMock.mockReturnValue({ eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { tidal_client_secret: 'enc:existing-secret' }, error: null }) })) })
    bandProfilesUpsertMock.mockResolvedValue({ error: null })

    const { POST } = await loadRoute()
    const response = await POST(makeRequest({
      bandName: 'Finding North',
      tidalClientId: 'client-id',
      tidalClientSecret: '',
    }))

    expect(response.status).toBe(307)
    expect(encryptTidalCredentialMock).not.toHaveBeenCalled()
    expect(bandProfilesUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tidal_client_secret: 'enc:existing-secret',
      }),
      { onConflict: 'band_id' }
    )
  })
})
