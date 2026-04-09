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

async function loadPage() {
  return await import('./page')
}

beforeEach(() => {
  createClientMock.mockReset()
  getAdminAccessMock.mockReset()
  createClientMock.mockResolvedValue({
    from: vi.fn((table: string) => {
      if (table === 'venue_provisioning_drafts') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({
                data: {
                  id: 'draft-1',
                  venue_lead_id: 'lead-1',
                  company_name: 'The River House',
                  contact_name: 'Ava',
                  status: 'draft',
                  follow_up_queue: 'venue-sales-hot',
                  operator_notes: 'Initial note',
                  created_by: 'stagesync-admin',
                },
                error: null,
              })),
            })),
          })),
        }
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({
              data: {
                id: 'lead-1',
                company_name: 'The River House',
                contact_name: 'Ava',
                interest_level: 'ready',
                follow_up_queue: 'venue-sales-hot',
                status: 'reviewing',
                operator_notes: 'Initial note',
              },
              error: null,
            })),
          })),
        })),
      }
    }),
  })
})

describe('AdminVenueProvisioningPage', () => {
  it('renders the venue provisioning detail for an admin', async () => {
    getAdminAccessMock.mockResolvedValue({ username: 'albert' })
    const { default: AdminVenueProvisioningPage } = await loadPage()
    const element = await AdminVenueProvisioningPage({ params: Promise.resolve({ id: 'lead-1' }), searchParams: Promise.resolve({ notice: 'updated' }) })

    render(element)

    expect(screen.getByRole('heading', { name: /venue provisioning detail/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /current draft/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /lead snapshot/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /provisioning notes/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /update handoff/i })).toBeInTheDocument()
    expect(screen.getByText(/provisioning draft updated/i)).toBeInTheDocument()
    expect(screen.getAllByText(/the river house/i).length).toBeGreaterThan(0)
  })
})
