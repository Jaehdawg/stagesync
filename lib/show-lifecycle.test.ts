import { describe, expect, it } from 'vitest'
import { resolveShowLifecycleTransition } from './show-lifecycle'

describe('show lifecycle helpers', () => {
  it('starts a show into a paid window', () => {
    const transition = resolveShowLifecycleTransition('start', {
      bandId: 'band-1',
      eventId: 'event-1',
      now: new Date('2026-04-05T14:00:00.000Z'),
    })

    expect(transition.eventUpdate).toEqual({ is_active: true, allow_signups: true, ended_at: null })
    expect(transition.windowUpdate).toMatchObject({
      bandId: 'band-1',
      eventId: 'event-1',
      showId: 'event-1',
      isPaidWindow: true,
      restartCount: 0,
      consumedCreditAt: '2026-04-05T14:00:00.000Z',
      undoGraceUntil: null,
    })
  })

  it('sets undo grace when a show is paused or ended', () => {
    const currentWindow = {
      showId: 'event-1',
      startedAt: '2026-04-05T14:00:00.000Z',
      expiresAt: '2026-04-06T14:00:00.000Z',
      consumedCreditAt: '2026-04-05T14:00:05.000Z',
      undoGraceUntil: null,
      restartCount: 1,
    }

    const pause = resolveShowLifecycleTransition('pause', {
      bandId: 'band-1',
      eventId: 'event-1',
      currentWindow,
      now: new Date('2026-04-05T15:00:00.000Z'),
    })

    expect(pause.eventUpdate).toEqual({ is_active: true, allow_signups: false, ended_at: null })
    expect(pause.windowUpdate?.undoGraceUntil).toBe('2026-04-05T15:05:00.000Z')

    const end = resolveShowLifecycleTransition('end', {
      bandId: 'band-1',
      eventId: 'event-1',
      currentWindow,
      now: new Date('2026-04-05T15:00:00.000Z'),
    })

    expect(end.eventUpdate).toEqual({ is_active: false, allow_signups: false, ended_at: '2026-04-05T15:00:00.000Z' })
    expect(end.windowUpdate?.undoGraceUntil).toBe('2026-04-05T15:05:00.000Z')
  })

  it('restores a show from undo grace', () => {
    const transition = resolveShowLifecycleTransition('undo', {
      bandId: 'band-1',
      eventId: 'event-1',
      currentWindow: {
        startedAt: '2026-04-05T14:00:00.000Z',
        expiresAt: '2026-04-06T14:00:00.000Z',
        consumedCreditAt: '2026-04-05T14:00:05.000Z',
        undoGraceUntil: '2026-04-05T15:05:00.000Z',
        restartCount: 1,
      },
      now: new Date('2026-04-05T15:04:59.000Z'),
    })

    expect(transition.eventUpdate).toEqual({ is_active: true, allow_signups: true, ended_at: null })
    expect(transition.windowUpdate?.undoGraceUntil).toBeNull()
  })
})
