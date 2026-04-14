import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createClientMock = vi.fn()
const createServiceClientMock = vi.fn()
const getAdminAccessMock = vi.fn()

vi.mock('@/utils/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('@/utils/supabase/service', () => ({
  createServiceClient: createServiceClientMock,
}))

vi.mock('@/lib/admin-access', () => ({
  getAdminAccess: getAdminAccessMock,
}))

vi.mock('@/components/band-access-form', () => ({
  BandAccessForm: () => null,
}))

vi.mock('@/lib/analytics-reporting', () => ({
  buildAnalyticsSections: () => ({
    funnel: {
      title: 'Core funnel',
      description: 'desc',
      items: [{ label: 'Bands onboarded', value: '5', detail: 'Bands with live profiles or account access.' }],
    },
    retention: {
      title: 'Retention and churn',
      description: 'desc',
      items: [{ label: 'Recent shows', value: '1', detail: 'Shows created in the last 30 days.' }],
    },
    usage: {
      title: 'Band / singer usage',
      description: 'desc',
      items: [{ label: 'Tracks played', value: '9', detail: 'Songs completed through the queue.' }],
    },
    storage: {
      title: 'Storage and export expectations',
      description: 'desc',
      items: [
        { label: 'Raw event log', value: 'analytics_events', detail: 'Append-only event capture for product, funnel, and lifecycle events.' },
        { label: 'Daily rollups', value: 'analytics_daily_rollups', detail: 'Precomputed summaries for dashboards and CSV exports.' },
      ],
    },
  }),
}))

vi.mock('@/lib/analytics-schema', () => ({
  getAnalyticsTrackingPlan: () => ({
    namingConventions: ['Use lowercase dotted names in the form area.action or area.entity.action.'],
    requiredMetadata: ['occurredAt timestamp', 'source surface or origin'],
    prohibitedData: ['raw card numbers, CVC, or any payment instrument secret'],
    eventSpecs: [
      { name: 'pricing.checkout.started', description: 'A checkout flow was launched from the pricing surface.' },
      { name: 'show.started', description: 'A live show started or resumed inside a paid window.' },
    ],
  }),
}))

function buildSupabaseClient() {
  return {
    from() {
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

function buildServiceClient() {
  return {
    rpc: vi.fn(async (fn: string) => {
      if (fn === 'get_admin_analytics_summary') {
        return {
          data: [{
            band_count: 5,
            show_count: 7,
            active_show_count: 1,
            singer_count: 9,
            tracks_played_count: 11,
            recent_show_count: 1,
          }],
          error: null,
        }
      }

      if (fn === 'get_admin_recent_shows') {
        return {
          data: [{ id: 'show-1', name: 'Launch Night', is_active: true, allow_signups: true, created_at: '2026-04-01T00:00:00Z' }],
          error: null,
        }
      }

      throw new Error(`Unexpected rpc: ${fn}`)
    }),
  }
}

async function loadPage() {
  return await import('./page')
}

beforeEach(() => {
  createClientMock.mockReset()
  createServiceClientMock.mockReset()
  getAdminAccessMock.mockReset()
  createClientMock.mockResolvedValue(buildSupabaseClient())
  createServiceClientMock.mockReturnValue(buildServiceClient())
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
    expect(screen.getByRole('heading', { name: /analytics event schema and tracking plan/i })).toBeInTheDocument()
    expect(screen.getByText(/analytics_events/i)).toBeInTheDocument()
    expect(screen.getByText(/analytics_daily_rollups/i)).toBeInTheDocument()
    expect(screen.getByText(/pricing.checkout.started/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /export csv/i })).toHaveAttribute('href', '/api/admin/analytics/export')
  })
})
