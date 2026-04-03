import { describe, expect, it } from 'vitest'
import { adminCopy } from './admin'

describe('admin copy', () => {
  it('keeps the admin page strings centralized', () => {
    expect(adminCopy.backToAdmin).toBe('Back to admin')
    expect(adminCopy.logoutLabel).toBe('Log out')
    expect(adminCopy.login.pageDescription).toContain('Admins sign in here')
    expect(adminCopy.bandsPage).toEqual(
      expect.objectContaining({
        title: 'Manage bands',
        liveTitle: 'Live bands',
        createButton: 'Create band',
        membersTitle: 'Members & admins',
        attachToBand: 'Attach to band',
      })
    )
    expect(adminCopy.usersPage).toEqual(
      expect.objectContaining({
        title: 'User management',
        saveUser: 'Save user',
        bandMemberships: 'Band memberships',
        noBandMemberships: 'No band memberships yet.',
      })
    )
  })
})
