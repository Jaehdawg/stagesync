import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createClientMock = vi.fn()
const getAdminAccessMock = vi.fn()

vi.mock('@/utils/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('@/lib/admin-access', () => ({
  getAdminAccess: getAdminAccessMock,
}))

vi.mock('@/components/band-access-form', () => ({
  BandAccessForm: () => null,
}))

function buildSupabaseClient() {
  return {
    from(table: string) {
      const terminal = Promise.resolve({ data: [], count: 0, error: null })
      const chain = {
        eq: vi.fn(() => chain),
        gte: vi.fn(() => chain),
        order: vi.fn(() => chain),
        limit: vi.fn(() => terminal),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
      }

      return {
        select: vi.fn(() => chain),
      }
    },
  }
}

async function loadPage() {
  return await import('./page')
}

beforeEach(() => {
  createClientMock.mockReset()
  getAdminAccessMock.mockReset()
  createClientMock.mockResolvedValue(buildSupabaseClient())
})

describe('AdminAnalyticsPage', () => {
  it('renders funnel, retention, usage, and storage reporting sections for an admin', async () => {
    getAdminAccessMock.mockResolvedValue({ username: 'albert' })
    const { default: AdminAnalyticsPage } = await loadPage()
    const element = await AdminAnalyticsPage()

    render(element)

    expect(screen.getByRole('heading', { name: /system analytics/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /core funnel/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /retention and churn/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /band \/ singer usage/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /storage and export expectations/i })).toBeInTheDocument()
    expect(screen.getByText(/analytics_events/i)).toBeInTheDocument()
    expect(screen.getByText(/analytics_daily_rollups/i)).toBeInTheDocument()
  })
})
