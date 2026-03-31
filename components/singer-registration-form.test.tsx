import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SingerRegistrationForm } from './singer-registration-form'

describe('SingerRegistrationForm', () => {
  it('sends a magic link with singer details', async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: null })

    render(
      <SingerRegistrationForm
        supabaseClient={{
          auth: { signInWithOtp },
        }}
      />
    )

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Maya' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Chen' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'maya@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }))

    await waitFor(() => expect(signInWithOtp).toHaveBeenCalledTimes(1))
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'maya@example.com',
      options: {
        emailRedirectTo: expect.stringContaining('/auth/callback'),
        data: {
          first_name: 'Maya',
          last_name: 'Chen',
          role: 'singer',
        },
      },
    })

    expect(screen.getByText(/check your email/i)).toBeInTheDocument()
  })

  it('shows an error when signup fails', async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: { message: 'Bad email' } })

    render(
      <SingerRegistrationForm
        supabaseClient={{
          auth: { signInWithOtp },
        }}
      />
    )

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Maya' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Chen' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'maya@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }))

    expect(await screen.findByText(/bad email/i)).toBeInTheDocument()
  })

  it('disables signup when the show is not accepting singers', async () => {
    render(
      <SingerRegistrationForm
        disabled
        statusMessage="The show is currently paused for signups."
        supabaseClient={{
          auth: { signInWithOtp: vi.fn() },
        }}
      />
    )

    expect(screen.getByRole('button', { name: /signups paused/i })).toBeDisabled()
    expect(screen.getByText(/paused for signups/i)).toBeInTheDocument()
  })
})
