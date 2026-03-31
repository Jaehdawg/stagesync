import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { BandAccessForm } from './band-access-form'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

describe('BandAccessForm', () => {
  it('signs a band member in with username and password', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'band login successful.' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(
      <BandAccessForm
        role="band"
        title="Band login"
        description="Band members use their username and password."
        submitLabel="Sign in"
        successMessage="Band login successful."
      />
    )

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'neon-echo-band' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'super-secret' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith('/api/testing/login', expect.any(Object))
    expect(screen.getByText(/band login successful/i)).toBeInTheDocument()
  })

  it('shows an error when the username does not match the requested role', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'No admin account found for that username.' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(
      <BandAccessForm
        role="admin"
        title="Admin login"
        description="Admin members use their username and password."
        submitLabel="Sign in"
        successMessage="Admin login successful."
      />
    )

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'neon-echo' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong-role' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/no admin account found/i)).toBeInTheDocument()
  })
})
