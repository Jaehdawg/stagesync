import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { SingerDashboardView } from './singer-dashboard-view'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock('./singer-registration-form', () => ({
  SingerRegistrationForm: ({ mode, variant }: { mode?: string; variant?: string }) => (
    <div>
      <h3>{variant === 'request' ? (mode === 'signup' ? 'Request Sign-up' : 'Request Login') : mode === 'signup' ? 'Singer Sign-up' : 'Singer Login'}</h3>
    </div>
  ),
}))

vi.mock('./singer-current-request-card', () => ({
  SingerCurrentRequestCard: () => <div>Current request</div>,
}))

vi.mock('./tidal-search-panel', () => ({
  TidalSearchPanel: () => <div>Search panel</div>,
}))

vi.mock('./song-lyrics-panel', () => ({
  SongLyricsPanel: () => <div>Lyrics</div>,
}))

describe('SingerDashboardView', () => {
  it('switches to request copy in request mode', () => {
    render(
      <SingerDashboardView
        requestModeEnabled
        signupEnabled
        signupStatusMessage="Requests are open."
        bandProfile={{ bandName: 'Finding North' }}
      />
    )

    expect(screen.getByText(/song requests/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^request$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /request login/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /request sign-up/i })).toBeInTheDocument()
  })
})
