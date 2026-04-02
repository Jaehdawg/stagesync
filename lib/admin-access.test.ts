import { describe, expect, it, vi, beforeEach } from 'vitest'
import { getAdminAccess } from './admin-access'

const authGetUser = vi.fn()
const profileMaybeSingle = vi.fn()

const supabase = {
  auth: { getUser: authGetUser },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: profileMaybeSingle,
      })),
    })),
  })),
} as any

describe('getAdminAccess', () => {
  beforeEach(() => {
    authGetUser.mockReset()
    profileMaybeSingle.mockReset()
    supabase.from.mockClear()
  })

  it('returns null when there is no authenticated user', async () => {
    authGetUser.mockResolvedValue({ data: { user: null } })

    await expect(getAdminAccess(supabase)).resolves.toBeNull()
  })

  it('returns live admin access for admin profiles', async () => {
    authGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'admin@example.com' } } })
    profileMaybeSingle.mockResolvedValue({ data: { id: 'user-1', username: 'jsmith', email: 'admin@example.com', role: 'admin' } })

    await expect(getAdminAccess(supabase)).resolves.toEqual({
      source: 'live',
      username: 'jsmith',
      userId: 'user-1',
    })
  })

  it('returns null for non-admin profiles', async () => {
    authGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'band@example.com' } } })
    profileMaybeSingle.mockResolvedValue({ data: { id: 'user-1', username: 'jsmith', email: 'band@example.com', role: 'band' } })

    await expect(getAdminAccess(supabase)).resolves.toBeNull()
  })
})
