import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const createServerClientMock = vi.fn()
const createServiceClientMock = vi.fn()

const authGetUserMock = vi.fn()
const profileMaybeSingleMock = vi.fn().mockResolvedValue({ data: { role: 'band' }, error: null })
const eventUpdateMock = vi.fn().mockResolvedValue({ error: null })
const ledgerInsertMock = vi.fn().mockResolvedValue({ error: null })
const windowUpsertMock = vi.fn().mockResolvedValue({ error: null })
const currentWindowMaybeSingleMock = vi.fn().mockResolvedValue({
  data: {
    started_at: '2026-04-05T14:00:00.000Z',
    expires_at: '2026-04-06T14:00:00.000Z',
    consumed_credit_at: '2026-04-05T14:00:05.000Z',
    undo_grace_until: null,
    restart_count: 1,
  },
  error: null,
})
const fromMock = vi.fn((table: string) => {
  if (table === 'profiles') {
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: profileMaybeSingleMock,
        })),
      })),
    }
  }

  if (table === 'events') {
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: { band_id: 'band-1' }, error: null }),
        })),
      })),
      update: vi.fn(() => ({
        eq: eventUpdateMock,
      })),
    }
  }

  if (table === 'billing_accounts') {
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'acct-1' }, error: null }),
        })),
      })),
    }
  }

  if (table === 'billing_credit_ledger') {
    return {
      insert: ledgerInsertMock,
    }
  }

  if (table === 'billing_show_windows') {
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: currentWindowMaybeSingleMock,
        })),
      })),
      upsert: windowUpsertMock,
    }
  }

  return { select: vi.fn(), update: vi.fn(), upsert: vi.fn() }
})

vi.mock('@supabase/ssr', () => ({
  createServerClient: createServerClientMock,
}))

vi.mock('@/utils/supabase/service', () => ({
  createServiceClient: createServiceClientMock,
}))

beforeEach(() => {
  createServerClientMock.mockReturnValue({
    auth: { getUser: authGetUserMock },
    from: fromMock,
    cookies: { getAll: () => [], setAll: vi.fn() },
  })
  createServiceClientMock.mockReturnValue({ from: fromMock })
  authGetUserMock.mockReset()
  authGetUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  profileMaybeSingleMock.mockReset()
  profileMaybeSingleMock.mockResolvedValue({ data: { role: 'band' }, error: null })
  eventUpdateMock.mockClear()
  ledgerInsertMock.mockClear()
  windowUpsertMock.mockClear()
  currentWindowMaybeSingleMock.mockResolvedValue({
    data: {
      started_at: '2026-04-05T14:00:00.000Z',
      expires_at: '2026-04-06T14:00:00.000Z',
      consumed_credit_at: '2026-04-05T14:00:05.000Z',
      undo_grace_until: null,
      restart_count: 1,
    },
    error: null,
  })
})

async function loadRoute() {
  return await import('./route')
}

function makeRequest(action: string) {
  const form = new FormData()
  form.append('action', action)

  return {
    formData: async () => form,
    cookies: { getAll: () => [], set: vi.fn() },
    headers: new Headers({ referer: 'https://example.com/band' }),
    url: 'https://example.com/api/shows/event-1/state',
  } as unknown as NextRequest
}

describe('show state route', () => {
  it('saves undo grace on pause and restores signups on undo', async () => {
    const { POST } = await loadRoute()

    const pauseResponse = await POST(makeRequest('pause'), { params: Promise.resolve({ id: 'event-1' }) })
    const undoResponse = await POST(makeRequest('undo'), { params: Promise.resolve({ id: 'event-1' }) })

    expect(pauseResponse.status).toBe(307)
    expect(undoResponse.status).toBe(307)
    expect(windowUpsertMock).toHaveBeenCalledWith(expect.objectContaining({ undo_grace_until: expect.any(String) }), { onConflict: 'event_id' })
    expect(eventUpdateMock).toHaveBeenCalled()
  })

  it('records the first paid show start as a credit consumption entry', async () => {
    currentWindowMaybeSingleMock.mockResolvedValue({ data: null, error: null })
    const { POST } = await loadRoute()

    await POST(makeRequest('start'), { params: Promise.resolve({ id: 'event-1' }) })

    expect(ledgerInsertMock).toHaveBeenCalledWith(expect.objectContaining({
      bandId: 'band-1',
      eventId: 'event-1',
      billingAccountId: 'acct-1',
      entryType: 'credit_consumed',
      amount: 1,
      provider: 'internal',
      note: 'First show start consumed one paid access credit.',
    }))
  })
})
