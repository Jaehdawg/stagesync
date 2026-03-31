import { describe, expect, it } from 'vitest'
import { canSingerSignUp, getShowState, getSignupCapacity } from './show-state'

describe('show-state helpers', () => {
  it('derives the show lifecycle state', () => {
    expect(getShowState({ is_active: true, allow_signups: true })).toBe('active')
    expect(getShowState({ is_active: true, allow_signups: false })).toBe('paused')
    expect(getShowState({ is_active: false, allow_signups: true })).toBe('ended')
  })

  it('gates singer signups to active shows only', () => {
    expect(canSingerSignUp({ is_active: true, allow_signups: true })).toBe(true)
    expect(canSingerSignUp({ is_active: true, allow_signups: false })).toBe(false)
    expect(canSingerSignUp({ is_active: false, allow_signups: true })).toBe(false)
  })

  it('estimates signup capacity from show length and buffer', () => {
    expect(getSignupCapacity({ show_duration_minutes: 60, buffer_minutes: 1 })).toBe(12)
    expect(getSignupCapacity({ show_duration_minutes: 45, buffer_minutes: 3 })).toBe(6)
  })
})
