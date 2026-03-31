import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BandAccessForm } from './band-access-form'

describe('BandAccessForm', () => {
  it('sends a band role magic link', async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: null })

    render(
      <BandAccessForm
        supabaseClient={{
          auth: { signInWithOtp },
        }}
      />
    )

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'band@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send band login link/i }))

    await waitFor(() => expect(signInWithOtp).toHaveBeenCalledTimes(1))
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'band@example.com',
      options: {
        emailRedirectTo: expect.stringContaining('/auth/callback?role=band'),
        data: {
          role: 'band',
        },
      },
    })
  })
})
