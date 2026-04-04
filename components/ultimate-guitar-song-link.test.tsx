import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { UltimateGuitarSongLink } from './ultimate-guitar-song-link'

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches,
    media: '(max-width: 767px)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('UltimateGuitarSongLink', () => {
  it('opens an embedded modal with a pre-searched Ultimate Guitar URL on desktop', () => {
    mockMatchMedia(false)

    render(
      <UltimateGuitarSongLink artist="Oasis" title="Wonderwall" className="test-trigger">
        Wonderwall - Oasis
      </UltimateGuitarSongLink>
    )

    fireEvent.click(screen.getByRole('button', { name: /wonderwall - oasis/i }))

    expect(screen.getByRole('heading', { name: /oasis — wonderwall/i })).toBeInTheDocument()
    const iframe = screen.getByTitle(/oasis wonderwall on ultimate guitar/i)
    expect(iframe).toHaveAttribute(
      'src',
      'https://www.ultimate-guitar.com/search.php?search_type=title&value=Oasis%20Wonderwall'
    )
  })

  it('opens a new tab on mobile instead of embedding', () => {
    const openMock = vi.fn()
    vi.stubGlobal('open', openMock)
    mockMatchMedia(true)

    render(
      <UltimateGuitarSongLink artist="Oasis" title="Wonderwall" className="test-trigger">
        Wonderwall - Oasis
      </UltimateGuitarSongLink>
    )

    fireEvent.click(screen.getByRole('button', { name: /wonderwall - oasis/i }))

    expect(openMock).toHaveBeenCalledWith(
      'https://www.ultimate-guitar.com/search.php?search_type=title&value=Oasis%20Wonderwall',
      '_blank',
      'noopener,noreferrer'
    )
    expect(screen.queryByTitle(/ultimate guitar/i)).not.toBeInTheDocument()
  })
})
