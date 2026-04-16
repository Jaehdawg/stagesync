export const singerCopy = {
  eyebrow: 'StageSync',
  noBandFound: "We couldn’t find that band’s singer page.",
  noActiveShow: {
    title: 'No active show yet',
    body: (bandName: string) =>
      `${bandName} doesn’t have an active show linked to this singer page yet. Ask the band to start a show, then use the generated singer link again.`,
    backToBandPortal: 'Back to band portal',
  },
  signupStatus: {
    open: (capacity: number) => `Signups are open. Singer Slots: ${capacity}`,
    paused: 'Signups are paused by the band.',
    ended: 'This show has ended and singer signups are closed.',
  },
  requestStatus: {
    open: (capacity: number) => `Requests are open. Singer Slots: ${capacity}`,
    paused: 'Requests are paused by the band.',
    ended: 'This show has ended and requests are closed.',
  },
  currentShowNameFallback: 'StageSync Show',
} as const
