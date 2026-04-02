import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLiveBandAccessContext } from './band-access'

vi.mock('./band-roles', () => ({
  listBandRolesForProfileId: vi.fn(),
}))

import { listBandRolesForProfileId } from './band-roles'

const mockedListBandRolesForProfileId = vi.mocked(listBandRolesForProfileId)

const authGetUser = vi.fn()
const profilesMaybeSingle = vi.fn()
const bandsMaybeSingle = vi.fn()

const authSupabase = {
  auth: { getUser: authGetUser },
} as any

const serviceSupabase = {
  from: vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: profilesMaybeSingle })),
        })),
      }
    }

    if (table === 'bands') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: bandsMaybeSingle })),
        })),
      }
    }

    return {}
  }),
} as any

describe('getLiveBandAccessContext', () => {
  beforeEach(() => {
    authGetUser.mockReset()
    profilesMaybeSingle.mockReset()
    bandsMaybeSingle.mockReset()
    mockedListBandRolesForProfileId.mockReset()
    serviceSupabase.from.mockClear()
  })

  it('returns null when there is no authenticated user', async () => {
    authGetUser.mockResolvedValue({ data: { user: null } })

    await expect(getLiveBandAccessContext(authSupabase, serviceSupabase)).resolves.toBeNull()
  })

  it('resolves live band admin access from active_band_id', async () => {
    authGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'jsmith@example.com' } } })
    profilesMaybeSingle.mockResolvedValue({
      data: {
        id: 'user-1',
        username: 'jsmith',
        display_name: 'John Smith',
        first_name: 'John',
        last_name: 'Smith',
        role: 'band',
        active_band_id: 'band-1',
      },
    })
    mockedListBandRolesForProfileId.mockResolvedValue([
      { id: 'role-1', band_id: 'band-1', profile_id: 'user-1', band_role: 'admin', active: true },
    ])
    bandsMaybeSingle.mockResolvedValue({ data: { id: 'band-1', band_name: 'Finding North' } })

    await expect(getLiveBandAccessContext(authSupabase, serviceSupabase, { requireAdmin: true })).resolves.toEqual({
      userId: 'user-1',
      username: 'jsmith',
      displayName: 'John Smith',
      bandId: 'band-1',
      bandName: 'Finding North',
      bandRole: 'admin',
    })
  })

  it('returns null when the resolved role is only member and admin is required', async () => {
    authGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'jsmith@example.com' } } })
    profilesMaybeSingle.mockResolvedValue({
      data: {
        id: 'user-1',
        username: 'jsmith',
        display_name: 'John Smith',
        first_name: 'John',
        last_name: 'Smith',
        role: 'band',
        active_band_id: 'band-1',
      },
    })
    mockedListBandRolesForProfileId.mockResolvedValue([
      { id: 'role-1', band_id: 'band-1', profile_id: 'user-1', band_role: 'member', active: true },
    ])

    await expect(getLiveBandAccessContext(authSupabase, serviceSupabase, { requireAdmin: true })).resolves.toBeNull()
  })
})
