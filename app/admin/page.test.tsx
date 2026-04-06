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

async function loadPage() {
  return await import('./page')
}

beforeEach(() => {
  createClientMock.mockReset()
  getAdminAccessMock.mockReset()
  createClientMock.mockResolvedValue({ auth: { getUser: vi.fn() } })
})

describe('AdminPage', () => {
  it('shows the billing readiness card on the admin dashboard', async () => {
    getAdminAccessMock.mockResolvedValue({ username: 'albert' })
    const { default: AdminPage } = await loadPage()
    const element = await AdminPage()

    render(element)

    expect(screen.getByRole('heading', { name: /stageSync admin/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /billing readiness/i })).toHaveAttribute('href', '/admin/billing')
  })
})
