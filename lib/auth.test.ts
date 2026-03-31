import { describe, expect, it } from 'vitest'
import { buildAuthCallbackUrl, buildHomeUrl } from './auth'

describe('auth url helpers', () => {
  it('builds the auth callback url from a base url', () => {
    expect(buildAuthCallbackUrl('https://stagesync-six.vercel.app')).toBe(
      'https://stagesync-six.vercel.app/auth/callback'
    )
  })

  it('builds home urls with status params', () => {
    expect(buildHomeUrl('https://stagesync-six.vercel.app', 'success')).toBe(
      'https://stagesync-six.vercel.app/?auth=success'
    )
    expect(buildHomeUrl('https://stagesync-six.vercel.app', 'error', 'bad')).toBe(
      'https://stagesync-six.vercel.app/?auth=error&message=bad'
    )
  })
})
