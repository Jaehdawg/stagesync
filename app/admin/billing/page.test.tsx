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

vi.mock('@/lib/stripe-billing', () => ({
  getStripeBillingConfig: () => ({ secretKey: 'sk_test_123', webhookSecret: 'whsec_123', professionalPriceId: 'price_123' }),
}))

vi.mock('@/lib/stripe-billing-readiness', () => ({
  getStripeBillingReadiness: () => ({
    stripeCheckoutReady: true,
    stripeWebhookReady: true,
    professionalPriceReady: true,
    hostedCheckoutReady: true,
    hostedPortalReady: true,
    hostedInvoicesReady: false,
    missingStripeKeys: [],
  }),
}))

async function loadPage() {
  return await import('./page')
}

beforeEach(() => {
  createClientMock.mockReset()
  getAdminAccessMock.mockReset()
  createClientMock.mockResolvedValue({ auth: { getUser: vi.fn() } })
})

describe('AdminBillingPage', () => {
  it('renders the billing readiness status surface for an admin', async () => {
    getAdminAccessMock.mockResolvedValue({ username: 'albert' })
    const { default: AdminBillingPage } = await loadPage()
    const element = await AdminBillingPage()

    render(element)

    expect(screen.getByRole('heading', { name: /billing readiness/i })).toBeInTheDocument()
    expect(screen.getByText('Stripe checkout', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText('Stripe webhook', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText('Professional price ID', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText('Hosted URLs', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /pci boundary/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /missing stripe keys/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /billing schema and resolver contract/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /resolver snapshot/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /audit \/ event log/i })).toBeInTheDocument()
  })
})
