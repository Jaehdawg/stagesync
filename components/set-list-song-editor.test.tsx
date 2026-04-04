import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SetListSongEditor } from './set-list-song-editor'

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

describe('SetListSongEditor', () => {
  it('lets a row open the Ultimate Guitar modal', () => {
    mockMatchMedia(false)

    render(<SetListSongEditor setListId="set-1" songs={[{ id: 'song-1', artist: 'Oasis', title: 'Wonderwall' }]} />)

    fireEvent.click(screen.getByRole('button', { name: /oasis — wonderwall/i }))

    expect(screen.getByRole('heading', { name: /oasis — wonderwall/i })).toBeInTheDocument()
    expect(screen.getByTitle(/oasis wonderwall on ultimate guitar/i)).toHaveAttribute(
      'src',
      'https://www.ultimate-guitar.com/search.php?search_type=title&value=Oasis%20Wonderwall'
    )
  })
})
