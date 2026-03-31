import { describe, expect, it } from 'vitest'
import { buildRootAuthRedirect } from './root-auth'

describe('buildRootAuthRedirect', () => {
  it('builds the callback url when code is present', () => {
    expect(buildRootAuthRedirect({ code: 'abc', role: 'band', siteUrl: 'https://stagesync-six.vercel.app' })).toBe(
      'https://stagesync-six.vercel.app/auth/callback?code=abc&role=band'
    )
  })

  it('returns null without a code', () => {
    expect(buildRootAuthRedirect({ role: 'singer' })).toBeNull()
  })
})
