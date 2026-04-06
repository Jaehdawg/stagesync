import { FREE_SHOWS_PER_BAND, PAID_SHOW_WINDOW_HOURS, getFreeShowsRemaining } from './billing'

export const UNDO_GRACE_MINUTES = 5

export type PaidShowWindow = {
  showId: string
  startedAt: string
  expiresAt: string
  consumedCreditAt: string | null
  undoGraceUntil: string | null
  restartCount: number
}

export function getDefaultFreeShowAllowance() {
  return FREE_SHOWS_PER_BAND
}

export function getAccountFreeShowRemaining(freeShowsUsed: number, freeShowsAllocated = FREE_SHOWS_PER_BAND) {
  return getFreeShowsRemaining({ freeShowsAllocated, freeShowsUsed })
}

export function isWithinPaidShowWindow(showWindow: Pick<PaidShowWindow, 'startedAt' | 'expiresAt'>, now = new Date()) {
  return now >= new Date(showWindow.startedAt) && now <= new Date(showWindow.expiresAt)
}

export function buildPaidShowWindow(showId: string, startedAt: Date = new Date()) {
  const expiresAt = new Date(startedAt.getTime() + PAID_SHOW_WINDOW_HOURS * 60 * 60 * 1000)

  return {
    showId,
    startedAt: startedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    consumedCreditAt: null,
    undoGraceUntil: null,
    restartCount: 0,
  } satisfies PaidShowWindow
}

export function buildUndoGraceWindow(startedAt: Date = new Date(), graceMinutes = UNDO_GRACE_MINUTES) {
  return new Date(startedAt.getTime() + graceMinutes * 60 * 1000).toISOString()
}

export function applyCreditConsumption(showWindow: PaidShowWindow, consumedAt: Date = new Date()): PaidShowWindow {
  return {
    ...showWindow,
    consumedCreditAt: consumedAt.toISOString(),
    restartCount: showWindow.restartCount + 1,
  }
}

export function shouldConsumeAnotherCreditForRestart(
  showWindow: Pick<PaidShowWindow, 'startedAt' | 'expiresAt' | 'consumedCreditAt' | 'undoGraceUntil' | 'restartCount'> | null | undefined,
  now: Date = new Date()
) {
  if (!showWindow) {
    return true
  }

  if (!isWithinPaidShowWindow(showWindow, now)) {
    return true
  }

  return showWindow.consumedCreditAt === null
}

export function isWithinUndoGrace(showWindow: Pick<PaidShowWindow, 'undoGraceUntil'> | null | undefined, now = new Date()) {
  if (!showWindow?.undoGraceUntil) {
    return false
  }

  return now <= new Date(showWindow.undoGraceUntil)
}

export function canUseFreeShows(freeShowsUsed: number, freeShowsAllocated = FREE_SHOWS_PER_BAND) {
  return getAccountFreeShowRemaining(freeShowsUsed, freeShowsAllocated) > 0
}
