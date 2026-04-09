import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createClientMock = vi.fn()
const getAdminAccessMock = vi.fn()
const recentLeads = [
  {
    id: 'lead_1',
    company_name: 'The River House',
    contact_name: 'Ava',
    interest_level: 'ready',
    follow_up_queue: 'venue-sales-hot',
    status: 'new',
    operator_notes: 'Need a follow-up.',
    commercial_terms: null,
    created_at: '2026-04-08T16:00:00.000Z',
  },
  {
    id: 'lead_2',
    company_name: 'Sunset Social',
    contact_name: 'Noah',
    interest_level: 'pricing',
    follow_up_queue: 'venue-sales-pricing',
    status: 'qualified',
    operator_notes: null,
    commercial_terms: null,
    created_at: '2026-04-08T15:00:00.000Z',
  },
]

vi.mock('@/utils/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('@/lib/admin-access', () => ({
  getAdminAccess: getAdminAccessMock,
}))

vi.mock('@/components/band-access-form', () => ({
  BandAccessForm: () => null,
}))

async function loadPage() {
  return await import('./page')
}

beforeEach(() => {
  createClientMock.mockReset()
  getAdminAccessMock.mockReset()
  createClientMock.mockResolvedValue({
    from: vi.fn(() => ({
      select: vi.fn((columns: string, options?: { count?: string; head?: boolean }) => {
        if (options?.head) {
          const countByStatus: Record<string, number> = {
            __all__: 4,
            reviewing: 1,
            qualified: 1,
            closed: 0,
          }

          return {
            count: countByStatus.__all__,
            error: null,
            eq: vi.fn((field: string, value: string) => ({
              count: field === 'status' ? (countByStatus[value] ?? 0) : 0,
              error: null,
            })),
          }
        }

        return {
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: recentLeads, error: null })),
          })),
        }
      }),
    })),
  })
})

describe('AdminVenuesPage', () => {
  it('renders the venue operations reporting shell for an admin', async () => {
    getAdminAccessMock.mockResolvedValue({ username: 'albert' })
    const { default: AdminVenuesPage } = await loadPage()
    const element = await AdminVenuesPage({ searchParams: Promise.resolve({}) })

    render(element)

    expect(screen.getByRole('heading', { name: /venue operations/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /venue admin provisioning and configuration/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /venue reporting requirements/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /operator-facing summaries/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /multi-band and multi-room access/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /support and admin tools/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save review/i })).toBeInTheDocument()
    expect(screen.getByText(/leads captured/i)).toBeInTheDocument()
    expect(screen.getByText(/the river house/i)).toBeInTheDocument()
  })

  it('shows the updated lead notice when redirected from a lead save', async () => {
    getAdminAccessMock.mockResolvedValue({ username: 'albert' })
    const { default: AdminVenuesPage } = await loadPage()
    const element = await AdminVenuesPage({ searchParams: Promise.resolve({ leadNotice: 'updated' }) })

    render(element)

    expect(screen.getByText(/venue lead updated and queued for follow-up/i)).toBeInTheDocument()
  })
})
