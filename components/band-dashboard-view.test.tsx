import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { BandDashboardView } from './band-dashboard-view'

const refreshMock = vi.fn()

vi.stubGlobal('matchMedia', vi.fn(() => ({
  matches: false,
  media: '(max-width: 767px)',
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  dispatchEvent: vi.fn(),
})) as unknown as typeof window.matchMedia)

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock }),
}))

const state = {
  brand: {
    label: 'StageSync',
    title: 'Neon Echo',
    description: 'Band dashboard',
  },
  analytics: [
    { label: 'Active Show', value: '🤘' },
    { label: 'Songs in queue', value: '12' },
    { label: 'Queued singers', value: '6' },
  ],
  queueItems: [
    { id: 'queue-1', position: 1, name: 'Avery', song: 'Maps - Yeah Yeah Yeahs', status: 'Now singing' },
  ],
  bandLinks: [{ label: 'Website', href: 'https://example.com' }],
  paymentLinks: [{ label: 'PayPal', href: 'https://paypal.com' }],
  customMessage: 'Thanks!',
  currentShowId: 'show-1',
  showState: 'active' as const,
  signupStatusMessage: 'Signups are open.',
  singerSignupUrl: 'https://stagesync.example/?band=neon-echo&show=show-1',
  setLists: [
    { id: 'set-1', name: 'Friday Set', is_active: true, songIds: ['song-1', 'song-2'] },
    { id: 'set-2', name: 'Backup Set', is_active: false, songIds: [] },
  ],
}

afterEach(() => {
  refreshMock.mockReset()
})

describe('BandDashboardView', () => {
  it('shows band controls without singer signup sections', () => {
    render(<BandDashboardView {...state} />)

    expect(screen.getByRole('heading', { name: /show controls/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /queue management/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /quick registration/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /singer experience/i })).not.toBeInTheDocument()
  })

  it('adds an undo action when a show is paused', () => {
    render(<BandDashboardView {...state} showState="paused" />)

    expect(screen.getByRole('button', { name: /undo pause/i })).toBeInTheDocument()
  })

  it('shows a create show form when there is no current show in test mode', () => {
    render(<BandDashboardView {...state} currentShowId={null} testMode currentShowName={null} />)

    expect(screen.getByRole('button', { name: /start show/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /pause signups/i })).not.toBeInTheDocument()
  })

  it('shows show settings when a test show exists', () => {
    render(
      <BandDashboardView
        {...state}
        currentShowId="show-1"
        currentShowName="Saturday Night"
        testMode
        hasTidalCredentials
        showDurationMinutes={90}
        signupBufferMinutes={2}
        songSourceMode="set_list"
      />
    )

    expect(screen.getByRole('button', { name: /save settings/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/show duration/i)).toHaveValue(90)
    expect(screen.getByLabelText(/buffer between songs/i)).toHaveValue(2)
    expect(screen.getAllByRole('option', { name: /tidal playlist/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('option', { name: /tidal catalog/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('option', { name: /set list/i }).length).toBeGreaterThan(0)
    expect(screen.getByText(/active set list/i)).toBeInTheDocument()
  })

  it('shows the playlist url field when playlist mode is selected', () => {
    render(
      <BandDashboardView
        {...state}
        currentShowId="show-1"
        currentShowName="Saturday Night"
        testMode
        hasTidalCredentials
        songSourceMode="tidal_playlist"
        tidalPlaylistUrl="https://tidal.com/playlist/abc123"
      />
    )

    expect(screen.getByLabelText(/playlist url/i)).toHaveValue('https://tidal.com/playlist/abc123')
    expect(screen.getByText(/imported Tidal playlist instead of the live catalog/i)).toBeInTheDocument()
  })

  it('shows request mode controls when requests are enabled', () => {
    render(
      <BandDashboardView
        {...state}
        currentShowId="show-1"
        currentShowName="Saturday Night"
        testMode
        requestModeEnabled
        requestSourceMode="set_list"
      />
    )

    expect(screen.getByRole('radio', { name: /requests/i })).toBeChecked()
    expect(screen.getByLabelText(/request source/i)).toBeInTheDocument()
    expect(screen.getByText(/requests will use this source/i)).toBeInTheDocument()
  })

  it('falls back when no active set list exists', () => {
    render(<BandDashboardView {...state} setLists={[]} />)

    expect(screen.queryByRole('option', { name: /set list/i })).not.toBeInTheDocument()
    expect(screen.getAllByText(/activate a set list to use set list mode/i).length).toBeGreaterThan(0)
  })

  it('asks for confirmation before deleting a set list', () => {
    const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<BandDashboardView {...state} />)

    fireEvent.submit(screen.getAllByRole('button', { name: /delete/i })[0].closest('form')!)

    expect(confirmMock).toHaveBeenCalledWith(expect.stringContaining('Delete this set list?'))
    confirmMock.mockRestore()
  })

  it('wires queue actions to the queue item id', () => {
    render(<BandDashboardView {...state} />)

    expect(screen.getByRole('button', { name: /played/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /move up/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /move down/i })).toBeInTheDocument()
  })

  it('shows the singer signup link and QR code', () => {
    render(<BandDashboardView {...state} />)

    expect(screen.getByRole('heading', { name: /singer signup link/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /https:\/\/stagesync\.example/ })).toBeInTheDocument()
    expect(screen.getByAltText(/singer signup qr code/i)).toBeInTheDocument()
  })
})
