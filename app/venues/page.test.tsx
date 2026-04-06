import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import VenuesPage from './page'

describe('VenuesPage', () => {
  it('renders the lead capture form and contact sales message', async () => {
    const element = await VenuesPage({ searchParams: Promise.resolve({}) })

    render(element)

    expect(screen.getByRole('heading', { name: /request a demo or contact sales/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /venue qualification form/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit venue inquiry/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /terms/i })).toBeInTheDocument()
  })
})
