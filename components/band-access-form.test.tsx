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
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null })
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { email: 'band@example.com', role: 'band' },
    })

    render(
      <BandAccessForm
        role="band"
        title="Band login"
        description="Band members use their username and password."
        submitLabel="Sign in"
        successMessage="Band login successful."
        supabaseClient={{
          auth: { signInWithPassword },
          from: () => ({
            select: () => ({
              eq: () => ({ maybeSingle }),
            }),
          }),
        }}
      />
    )

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'neon-echo' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'super-secret' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(signInWithPassword).toHaveBeenCalledTimes(1))
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'band@example.com',
      password: 'super-secret',
    })
    expect(screen.getByText(/band login successful/i)).toBeInTheDocument()
  })

  it('shows an error when the username does not match the requested role', async () => {
    render(
      <BandAccessForm
        role="admin"
        title="Admin login"
        description="Admin members use their username and password."
        submitLabel="Sign in"
        successMessage="Admin login successful."
        supabaseClient={{
          auth: { signInWithPassword: vi.fn() },
          from: () => ({
            select: () => ({
              eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { email: 'band@example.com', role: 'band' } }) }),
            }),
          }),
        }}
      />
    )

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'neon-echo' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong-role' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/no admin account found/i)).toBeInTheDocument()
  })
})
