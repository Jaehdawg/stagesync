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
  createClientMock.mockResolvedValue({})
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
  })
})
