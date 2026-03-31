import { describe, expect, it, vi } from 'vitest'
import { getLatestTestBandProfile } from './test-band-profile'

describe('test band profile helper', () => {
  it('returns null when rpc fails', async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ error: { message: 'missing' } }),
    } as Parameters<typeof getLatestTestBandProfile>[0]

    await expect(getLatestTestBandProfile(supabase)).resolves.toBeNull()
  })
})
