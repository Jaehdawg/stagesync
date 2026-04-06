import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getTestSessionMock = vi.fn()
const getTestLoginMock = vi.fn()
const getLiveBandAccessContextMock = vi.fn()
const getBandProfileForBandIdMock = vi.fn()
const createClientMock = vi.fn()
const createServiceClientMock = vi.fn()
const createQueryMock = vi.fn()

vi.mock('@/utils/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('@/utils/supabase/service', () => ({
  createServiceClient: createServiceClientMock,
}))

vi.mock('@/lib/test-session', () => ({
  getTestSession: getTestSessionMock,
}))

vi.mock('@/lib/test-login-list', () => ({
  getTestLogin: getTestLoginMock,
}))

vi.mock('@/lib/band-access', () => ({
  getLiveBandAccessContext: getLiveBandAccessContextMock,
}))

vi.mock('@/lib/band-tenancy', () => ({
  getBandProfileForBandId: getBandProfileForBandIdMock,
}))

vi.mock('@/components/band-access-form', () => ({
  BandAccessForm: () => null,
}))

function buildSupabaseClient() {
  return {
    from(table: string) {
      if (table === 'band_profiles' || table === 'billing_accounts') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: async () => createQueryMock(table),
            })),
          })),
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    },
  }
}

async function loadPage() {
  return await import('./page')
}

beforeEach(() => {
  getTestSessionMock.mockReset()
  getTestLoginMock.mockReset()
  getLiveBandAccessContextMock.mockReset()
  getBandProfileForBandIdMock.mockReset()
  createClientMock.mockClear()
  createServiceClientMock.mockClear()
  createQueryMock.mockReset()
  createClientMock.mockReturnValue(buildSupabaseClient())
  createServiceClientMock.mockReturnValue(buildSupabaseClient())
  getLiveBandAccessContextMock.mockResolvedValue({
    userId: 'user-1',
    username: 'northside',
    displayName: 'Northside',
    bandId: 'band-1',
    bandName: 'Northside',
    bandRole: 'admin',
  })
  getBandProfileForBandIdMock.mockResolvedValue(null)
  createQueryMock.mockImplementation((table: string) => {
    if (table === 'band_profiles') {
      return { data: { tidal_client_id: 'tidal-1', tidal_client_secret: 'tidal-secret' }, error: null }
    }

    if (table === 'billing_accounts') {
      return {
        data: {
          status: 'active',
          payment_provider: 'stripe',
          payment_subscription_id: 'sub_123',
          free_shows_allocated: 3,
          free_shows_used: 1,
        },
        error: null,
      }
    }

    return { data: null, error: null }
  })
})

describe('BandAccountPage', () => {
  it('renders the subscription status surface for an admin band account', async () => {
    getTestSessionMock.mockResolvedValue(null)

    const { default: BandAccountPage } = await loadPage()
    const element = await BandAccountPage({ searchParams: Promise.resolve({ subscriptionNotice: 'checkout-pending' }) })

    render(element)

    expect(screen.getByRole('heading', { name: /professional/i })).toBeInTheDocument()
    expect(screen.getByText(/professional access is active/i)).toBeInTheDocument()
    expect(screen.getByText(/monthly only/i)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /open billing portal/i }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('button', { name: /downgrade to free/i }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/payment methods and invoices/i)).toBeInTheDocument()
    expect(screen.getAllByText(/hosted checkout is not wired yet/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/2 of 3 remaining/i)).toBeInTheDocument()
  })

  it('shows the free state when no billing account exists', async () => {
    createQueryMock.mockImplementation((table: string) => {
      if (table === 'band_profiles') {
        return { data: { tidal_client_id: null, tidal_client_secret: null }, error: null }
      }

      if (table === 'billing_accounts') {
        return {
          data: null,
          error: null,
        }
      }

      return { data: null, error: null }
    })

    const { default: BandAccountPage } = await loadPage()
    const element = await BandAccountPage({ searchParams: Promise.resolve({}) })

    render(element)

    expect(screen.getByRole('heading', { name: /free/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /start professional checkout/i }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/professional is delivered through hosted checkout when enabled/i)).toBeInTheDocument()
  })

  it('shows a hosted billing attention message for past due accounts', async () => {
    createQueryMock.mockImplementation((table: string) => {
      if (table === 'band_profiles') {
        return { data: { tidal_client_id: null, tidal_client_secret: null }, error: null }
      }

      if (table === 'billing_accounts') {
        return {
          data: {
            status: 'past_due',
            payment_provider: 'stripe',
            payment_subscription_id: 'sub_123',
            free_shows_allocated: 3,
            free_shows_used: 2,
          },
          error: null,
        }
      }

      return { data: null, error: null }
    })

    const { default: BandAccountPage } = await loadPage()
    const element = await BandAccountPage({ searchParams: Promise.resolve({}) })

    render(element)

    expect(screen.getAllByText(/update your payment method in the hosted billing portal/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Payment methods', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText('Invoices and receipts', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText('Plan management', { selector: 'p' })).toBeInTheDocument()
  })

  it('shows the per-event credit purchase surface', async () => {
    getTestSessionMock.mockResolvedValue(null)

    const { default: BandAccountPage } = await loadPage()
    const element = await BandAccountPage({ searchParams: Promise.resolve({ creditNotice: 'checkout-complete' }) })

    render(element)

    expect(screen.getByRole('heading', { name: /one-off show credit/i })).toBeInTheDocument()
    expect(screen.getByText(/buy a credit for a single show/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /buy show credit/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /view receipts/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /i agree to the terms of service before purchasing/i })).toBeInTheDocument()
    expect(screen.getByText(/per-event credit purchase completed/i)).toBeInTheDocument()
  })
})
