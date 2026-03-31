import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SongRequestForm } from './song-request-form'

describe('SongRequestForm', () => {
  it('adds a song request', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Added to the queue.' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<SongRequestForm />)

    fireEvent.change(screen.getByLabelText(/song title/i), { target: { value: 'Dreams' } })
    fireEvent.change(screen.getByLabelText(/artist/i), { target: { value: 'Fleetwood Mac' } })
    fireEvent.click(screen.getByRole('button', { name: /add to queue/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith('/api/queue', expect.any(Object))
    expect(screen.getByText(/added to the queue/i)).toBeInTheDocument()
  })

  it('shows an error when signups are paused', async () => {
    render(<SongRequestForm disabled statusMessage="Signups are currently paused by the band." />)

    expect(screen.getByRole('button', { name: /signups paused/i })).toBeDisabled()
    expect(screen.getByText(/paused by the band/i)).toBeInTheDocument()
  })
})
