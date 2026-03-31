import { describe, expect, it, vi } from 'vitest'
import { getLatestTestBandProfile } from './test-band-profile'

describe('test band profile helper', () => {
  it('returns null when the table query fails', async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ error: { message: 'missing' } }),
            }),
          }),
        }),
      }),
    } as Parameters<typeof getLatestTestBandProfile>[0]

    await expect(getLatestTestBandProfile(supabase)).resolves.toBeNull()
  })
})
