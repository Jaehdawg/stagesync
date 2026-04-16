import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { SingerRegistrationForm } from './singer-registration-form'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

describe('SingerRegistrationForm', () => {
  it('creates a singer account and signs the user in', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ message: 'Singer account created.' }),
    })
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null })

    vi.stubGlobal('fetch', fetchMock)

    render(
      <SingerRegistrationForm
        supabaseClient={{
          auth: { signInWithPassword },
        }}
      />
    )

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Maya' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Chen' } })
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'maya@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Singer123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign-up/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/singer/signup', expect.any(Object)))
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'maya@example.com', password: 'Singer123' })
    expect(screen.getByText(/Singer account created/i)).toBeInTheDocument()
  })

  it('shows validation errors for bad email or weak password', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    render(<SingerRegistrationForm />)

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Maya' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Chen' } })
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'maya@bad' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'short' } })
    fireEvent.click(screen.getByRole('button', { name: /sign-up/i }))

    expect(screen.getByText(/valid email address/i)).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows an error when signup fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Bad signup' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<SingerRegistrationForm supabaseClient={{ auth: { signInWithPassword: vi.fn() } }} />)

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Maya' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Chen' } })
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'maya@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Singer123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign-up/i }))

    expect(await screen.findByText(/bad signup/i)).toBeInTheDocument()
  })

  it('disables signup when the show is not accepting singers', () => {
    render(
      <SingerRegistrationForm
        disabled
        statusMessage="The show is currently paused for signups."
        supabaseClient={{ auth: { signInWithPassword: vi.fn() } }}
      />
    )

    expect(screen.getByRole('button', { name: /signups paused/i })).toBeDisabled()
    expect(screen.getByText(/paused for signups/i)).toBeInTheDocument()
  })

  it('uses request copy in request mode', () => {
    render(<SingerRegistrationForm variant="request" />)

    expect(screen.getByRole('heading', { name: /request sign-up/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /request sign-up/i })).toBeInTheDocument()
  })
})
