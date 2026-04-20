import { beforeEach, describe, expect, it, vi } from 'vitest'
import { normalizeQueuePositions } from './queue-order'

const updateEqMock = vi.fn()
const rows = [
  { id: 'b', position: 1 },
  { id: 'a', position: 3 },
  { id: 'c', position: null },
]

const supabase = {
  from: vi.fn(() => ({
    select: () => ({
      eq: () => ({
        eq: () => ({
          in: () => ({
            order: () => ({
              order: () => Promise.resolve({ data: rows, error: null }),
            }),
          }),
        }),
      }),
    }),
    update: () => ({
      eq: updateEqMock,
    }),
  })),
}

beforeEach(() => {
  updateEqMock.mockReset()
  updateEqMock.mockResolvedValue({ error: null })
  supabase.from.mockClear()
})

describe('normalizeQueuePositions', () => {
  it('renumbers queue items sequentially', async () => {
    await normalizeQueuePositions(supabase, { bandId: 'band-1', eventId: 'show-1' })

    expect(updateEqMock).toHaveBeenCalledTimes(2)
    expect(updateEqMock).toHaveBeenNthCalledWith(1, 'id', 'a')
    expect(updateEqMock).toHaveBeenNthCalledWith(2, 'id', 'c')
  })
})
