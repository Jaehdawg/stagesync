import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SongLibrarySongList } from './song-library-song-list'

describe('SongLibrarySongList', () => {
  it('supports selecting multiple songs for bulk set-list actions', () => {
    const { container } = render(
      <SongLibrarySongList
        songs={[
          { id: 'song-1', artist: 'Fleetwood Mac', title: 'Dreams', duration_ms: 300000 },
          { id: 'song-2', artist: 'Yeah Yeah Yeahs', title: 'Maps', duration_ms: 240000 },
        ]}
        setLists={[{ id: 'set-1', name: 'Friday Set', is_active: true }]}
      />
    )

    fireEvent.click(screen.getByLabelText('Select Fleetwood Mac — Dreams'))
    fireEvent.click(screen.getByLabelText('Select Yeah Yeah Yeahs — Maps'))

    expect(screen.getByRole('button', { name: /add selected to set list/i })).toBeEnabled()
    expect(screen.getAllByText(/2 songs selected/i).length).toBeGreaterThan(0)

    const hiddenSongIds = Array.from(container.querySelectorAll('input[type="hidden"][name="songIds"]')).map((input) => (input as HTMLInputElement).value)
    expect(hiddenSongIds).toEqual(['song-1', 'song-2', 'song-1', 'song-2'])
  })
})
