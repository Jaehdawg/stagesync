import { UNDO_GRACE_MINUTES, buildPaidShowWindow, buildUndoGraceWindow, isWithinUndoGrace, shouldConsumeAnotherCreditForRestart, type PaidShowWindow } from './entitlements'

export type ShowLifecycleAction = 'start' | 'pause' | 'resume' | 'end' | 'undo'

export type ShowLifecycleWindowRecord = PaidShowWindow & {
  billingAccountId: string | null
  bandId: string
  eventId: string
  isPaidWindow: boolean
}

export type ShowLifecycleTransition = {
  eventUpdate: {
    is_active: boolean
    allow_signups: boolean
    ended_at: string | null
  }
  windowUpdate: ShowLifecycleWindowRecord | null
  needsQueuePreservation: boolean
}

export function resolveShowLifecycleTransition(
  action: ShowLifecycleAction,
  input: {
    bandId: string
    eventId: string
    billingAccountId?: string | null
    currentWindow?: Pick<PaidShowWindow, 'startedAt' | 'expiresAt' | 'consumedCreditAt' | 'undoGraceUntil' | 'restartCount'> | null
    now?: Date
  }
): ShowLifecycleTransition {
  const now = input.now ?? new Date()
  const billingAccountId = input.billingAccountId ?? null
  const baseWindow = input.currentWindow ?? null

  switch (action) {
    case 'start':
    case 'resume': {
      const shouldChargeAgain = shouldConsumeAnotherCreditForRestart(baseWindow, now)
      const paidWindow = shouldChargeAgain
        ? buildPaidShowWindow(input.eventId, now)
        : ({
            showId: input.eventId,
            startedAt: baseWindow!.startedAt,
            expiresAt: baseWindow!.expiresAt,
            consumedCreditAt: baseWindow!.consumedCreditAt,
            undoGraceUntil: baseWindow!.undoGraceUntil,
            restartCount: baseWindow!.restartCount,
          } satisfies PaidShowWindow)

      const windowUpdate: ShowLifecycleWindowRecord = {
        ...paidWindow,
        showId: input.eventId,
        billingAccountId,
        bandId: input.bandId,
        eventId: input.eventId,
        isPaidWindow: true,
      }

      return {
        eventUpdate: { is_active: true, allow_signups: true, ended_at: null },
        windowUpdate,
        needsQueuePreservation: true,
      }
    }
    case 'pause':
      return {
        eventUpdate: { is_active: true, allow_signups: false, ended_at: null },
        windowUpdate: baseWindow
          ? {
              ...baseWindow,
              showId: input.eventId,
              billingAccountId,
              bandId: input.bandId,
              eventId: input.eventId,
              isPaidWindow: true,
              undoGraceUntil: buildUndoGraceWindow(now, UNDO_GRACE_MINUTES),
            }
          : null,
        needsQueuePreservation: true,
      }
    case 'end':
      return {
        eventUpdate: { is_active: false, allow_signups: false, ended_at: now.toISOString() },
        windowUpdate: baseWindow
          ? {
              ...baseWindow,
              showId: input.eventId,
              billingAccountId,
              bandId: input.bandId,
              eventId: input.eventId,
              isPaidWindow: true,
              undoGraceUntil: buildUndoGraceWindow(now, UNDO_GRACE_MINUTES),
            }
          : null,
        needsQueuePreservation: true,
      }
    case 'undo':
      return {
        eventUpdate: { is_active: true, allow_signups: true, ended_at: null },
        windowUpdate: baseWindow && isWithinUndoGrace(baseWindow, now)
          ? {
              ...baseWindow,
              showId: input.eventId,
              billingAccountId,
              bandId: input.bandId,
              eventId: input.eventId,
              isPaidWindow: true,
              undoGraceUntil: null,
            }
          : null,
        needsQueuePreservation: true,
      }
  }
}
