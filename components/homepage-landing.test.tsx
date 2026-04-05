import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HomepageLanding } from './homepage-landing'

describe('HomepageLanding', () => {
  it('renders the conversion-focused homepage sections and CTAs', () => {
    render(<HomepageLanding />)

    expect(screen.getByRole('heading', { name: /run the room, keep the queue moving/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /start a free trial/i }).find((link) => link.getAttribute('href') === '/band')).toBeTruthy()
    expect(screen.getAllByRole('link', { name: /learn more/i }).find((link) => link.getAttribute('href') === '#learn-more')).toBeTruthy()
    expect(screen.getByRole('heading', { name: /three steps from doors open to last song/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /bands first, venues second/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /simple pricing that maps to how live nights are actually run/i })).toBeInTheDocument()
    expect(screen.getByText(/no stock-photo fluff/i)).toBeInTheDocument()
  })
})
