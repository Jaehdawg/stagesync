import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createClientMock = vi.fn()
const getAdminAccessMock = vi.fn()
const selectMock = vi.fn()

const recentLeads = [
  {
    id: 'lead-1',
    company_name: 'Northside Tavern',
    contact_name: 'Avery',
    interest_level: 'demo',
    follow_up_queue: 'venue-sales-demo',
    status: 'reviewing',
    operator_notes: 'Needs room-by-room pricing.',
    commercial_terms: 'Custom base price $499 / month.',
    created_at: '2026-04-07T18:00:00Z',
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
  selectMock.mockReset()
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
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({ data: recentLeads, error: null })),
              })),
            })),
          })),
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
    const element = await AdminVenuesPage()

    render(element)

    expect(screen.getByRole('heading', { name: /venue operations/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /venue admin provisioning and configuration/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /venue reporting requirements/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /operator-facing summaries/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /multi-band and multi-room access/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /support and admin tools/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save review/i })).toBeInTheDocument()
    expect(screen.getByText(/leads captured/i)).toBeInTheDocument()
  })
})
