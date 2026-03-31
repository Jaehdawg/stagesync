import { describe, expect, it } from 'vitest'
import { getTestLoginCookieName, getTestLoginPasswordHash, signTestSession, verifyTestSession } from './test-login'

describe('test-login helpers', () => {
  it('hashes passwords deterministically', () => {
    expect(getTestLoginPasswordHash('neon-echo-band', 'BandTest123!')).toBe(
      'f2ea211322b9659fa7bc9f1bdb4a710f6723abca6e0a8b9fc23adad0bee4bfe9'
    )
  })

  it('signs and verifies sessions', () => {
    const cookie = signTestSession({ role: 'band', username: 'neon-echo-band' })
    expect(verifyTestSession(cookie)).toEqual({ role: 'band', username: 'neon-echo-band' })
  })

  it('returns the cookie name', () => {
    expect(getTestLoginCookieName()).toBe('stagesync_test_session')
  })
})
