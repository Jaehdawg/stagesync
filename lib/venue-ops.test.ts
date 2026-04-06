import { describe, expect, it } from 'vitest'
import { buildVenueOperatorSections } from './venue-ops'

describe('venue operator helpers', () => {
  it('describes venue reporting and access patterns', () => {
    const sections = buildVenueOperatorSections()

    expect(sections).toHaveLength(4)
    expect(sections[0].title).toBe('Venue reporting requirements')
    expect(sections[2].items.some((item) => item.title === 'Room-level scope')).toBe(true)
    expect(sections[3].items.some((item) => item.title === 'Terms control')).toBe(true)
  })
})
