import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DeleteAllSongsButton } from './delete-all-songs-button'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('DeleteAllSongsButton', () => {
  it('asks for confirmation before submitting the delete-all action', () => {
    const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(<DeleteAllSongsButton label="Delete all songs" confirmText="Confirm delete all" />)

    fireEvent.submit(screen.getByRole('button', { name: /delete all songs/i }).closest('form')!)

    expect(confirmMock).toHaveBeenCalledWith('Confirm delete all')
  })
})
