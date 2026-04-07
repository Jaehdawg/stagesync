import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const getRequestAdminAccessMock = vi.fn()
const createServiceClientMock = vi.fn()

vi.mock('../../../../../lib/admin-access', () => ({
  getRequestAdminAccess: getRequestAdminAccessMock,
}))

vi.mock('../../../../../utils/supabase/service', () => ({
  createServiceClient: createServiceClientMock,
}))

async function loadRoute() {
  return await import('./route')
}

beforeEach(() => {
  getRequestAdminAccessMock.mockReset()
  createServiceClientMock.mockReset()
})

describe('analytics export route', () => {
  it('exports csv for admins from daily rollups', async () => {
    getRequestAdminAccessMock.mockResolvedValue({ source: 'live', username: 'albert' })
    createServiceClientMock.mockReturnValue({
      from: () => ({
        select: () => ({
          order: () => ({
            order: () => ({
              order: async () => ({
                data: [
                  { rollup_date: '2026-04-07', band_id: 'band-1', metric_key: 'shows_created', metric_value: 4 },
                  { rollup_date: '2026-04-07', band_id: null, metric_key: 'system_events', metric_value: 9 },
                ],
                error: null,
              }),
            }),
          }),
        }),
      }),
    })

    const { GET } = await loadRoute()
    const request = {
      cookies: { getAll: () => [], set: vi.fn() },
      headers: { get: () => null },
    } as unknown as NextRequest

    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/csv')
    expect(response.headers.get('content-disposition')).toContain('stagesync-analytics-rollups.csv')
    expect(await response.text()).toBe([
      'rollup_date,band_id,metric_key,metric_value',
      '2026-04-07,band-1,shows_created,4',
      '2026-04-07,,system_events,9',
      '',
    ].join('\n'))
  })

  it('rejects non-admin access', async () => {
    getRequestAdminAccessMock.mockResolvedValue(null)
    const { GET } = await loadRoute()
    const request = {
      cookies: { getAll: () => [], set: vi.fn() },
      headers: { get: () => null },
    } as unknown as NextRequest

    const response = await GET(request)

    expect(response.status).toBe(403)
  })
})
