import { describe, expect, it } from 'vitest'
import {
  applyCreditConsumption,
  buildPaidShowWindow,
  buildUndoGraceWindow,
  canUseFreeShows,
  getAccountFreeShowRemaining,
  getDefaultFreeShowAllowance,
  isWithinPaidShowWindow,
  isWithinUndoGrace,
  shouldConsumeAnotherCreditForRestart,
} from './entitlements'

describe('entitlement helpers', () => {
  it('keeps the default free-show allowance at three per band', () => {
    expect(getDefaultFreeShowAllowance()).toBe(3)
  })

  it('counts remaining free shows from the band allowance', () => {
    expect(getAccountFreeShowRemaining(0)).toBe(3)
    expect(getAccountFreeShowRemaining(2)).toBe(1)
    expect(getAccountFreeShowRemaining(3)).toBe(0)
  })

  it('treats a paid show as valid for 24 hours after start', () => {
    const startedAt = new Date('2026-04-05T14:00:00.000Z')
    const window = buildPaidShowWindow('show-1', startedAt)

    expect(isWithinPaidShowWindow(window, new Date('2026-04-05T20:00:00.000Z'))).toBe(true)
    expect(isWithinPaidShowWindow(window, new Date('2026-04-06T14:00:00.000Z'))).toBe(true)
    expect(isWithinPaidShowWindow(window, new Date('2026-04-06T14:00:00.001Z'))).toBe(false)
  })

  it('does not burn another credit when a show restarts inside the same active window', () => {
    const window = {
      ...buildPaidShowWindow('show-1', new Date('2026-04-05T14:00:00.000Z')),
      consumedCreditAt: '2026-04-05T14:00:05.000Z',
    }

    expect(shouldConsumeAnotherCreditForRestart(window, new Date('2026-04-05T15:00:00.000Z'))).toBe(false)
    expect(shouldConsumeAnotherCreditForRestart({ ...window, consumedCreditAt: null }, new Date('2026-04-05T15:00:00.000Z'))).toBe(true)
    expect(shouldConsumeAnotherCreditForRestart(window, new Date('2026-04-06T15:00:00.000Z'))).toBe(true)
  })

  it('tracks undo grace and consumption updates for the show lifecycle', () => {
    const startedAt = new Date('2026-04-05T14:00:00.000Z')
    const window = buildPaidShowWindow('show-1', startedAt)
    const updatedWindow = {
      ...window,
      undoGraceUntil: buildUndoGraceWindow(startedAt),
    }

    expect(isWithinUndoGrace(updatedWindow, new Date('2026-04-05T14:04:59.000Z'))).toBe(true)
    expect(isWithinUndoGrace(updatedWindow, new Date('2026-04-05T14:05:01.000Z'))).toBe(false)

    const consumedWindow = applyCreditConsumption(updatedWindow, new Date('2026-04-05T14:00:10.000Z'))

    expect(consumedWindow.consumedCreditAt).toBe('2026-04-05T14:00:10.000Z')
    expect(consumedWindow.restartCount).toBe(1)
  })

  it('treats undo grace as active only until the grace deadline', () => {
    expect(isWithinUndoGrace({ undoGraceUntil: '2026-04-05T14:15:00.000Z' }, new Date('2026-04-05T14:14:59.000Z'))).toBe(true)
    expect(isWithinUndoGrace({ undoGraceUntil: '2026-04-05T14:15:00.000Z' }, new Date('2026-04-05T14:15:00.001Z'))).toBe(false)
    expect(canUseFreeShows(2)).toBe(true)
    expect(canUseFreeShows(3)).toBe(false)
  })
})
