export const homeCopy = {
  eyebrow: 'StageSync',
  topNav: {
    learnMore: 'Learn more',
    startFreeTrial: 'Start a free trial',
  },
  hero: {
    badge: 'Bands first. Venues too.',
    headline: 'Run the room, keep the queue moving, and make the night feel effortless.',
    subhead:
      'StageSync turns singer sign-ups, show controls, and set lists into one clean workflow so bands can focus on the room and venues can keep the night on rails.',
    primaryCta: 'Start a free trial',
    secondaryCta: 'Learn more',
    footnote: 'Fast enough for a packed room. Clear enough for the staff running it.',
  },
  proof: {
    title: 'Built for the people running live nights',
    items: ['Bands', 'Venues', 'Hosts', 'Crowds'],
  },
  howItWorks: {
    eyebrow: 'How it works',
    title: 'Three steps from doors open to last song.',
    steps: [
      {
        title: '1. Set up the show',
        body: 'Create the show, publish the singer link, and choose the band workflow that fits the room.',
      },
      {
        title: '2. Keep the queue clean',
        body: 'Manage requests, queue order, and song lists from one fast band dashboard.',
      },
      {
        title: '3. Stay in sync',
        body: 'Bands and venues see the same live state, so nobody is guessing what happens next.',
      },
    ],
  },
  audiences: {
    eyebrow: 'Who it is for',
    title: 'Bands, singers, and venues all win.',
    items: [
      {
        title: 'Singers',
        body: 'Make sign-up feel fast and fair, keep the queue easy to follow, and give singers a better night so they stay engaged and come back.',
      },
      {
        title: 'Bands',
        body: 'Keep singers moving, build set lists quickly, and run the night without juggling spreadsheets or side chats.',
      },
      {
        title: 'Venues',
        body: 'Give staff a clearer operating picture for the room, the queue, and the show state with less back-and-forth — which helps the room move faster and sell more drinks.',
      },
    ],
  },
  benefits: {
    eyebrow: 'Why StageSync',
    title: 'Less chaos, more time performing.',
    items: [
      'One live show page for singers, bands, and staff',
      'Set lists, song library, and queue tools in one place',
      'Built for mobile-first crowd interaction',
      'Built to keep singers happy, the room moving, and the night more profitable',
    ],
  },
  pricing: {
    eyebrow: 'Pricing',
    title: 'Simple pricing that maps to how live nights are actually run.',
    items: [
      { label: 'Band SaaS', value: '$29/mo', note: 'For regular weekly rooms and working bands.' },
      { label: 'Venue license', value: 'Custom', note: 'For multi-room venues and larger operators.' },
      { label: 'Per-event', value: '$10/night', note: 'For one-off shows, pop-ups, and trial runs.' },
    ],
  },
  trial: {
    eyebrow: 'Start a free trial',
    title: 'Want to try it tonight?',
    body: 'Jump into the band portal, create a show, and see the full workflow in a few minutes.',
    cta: 'Start a free trial',
    secondaryCta: 'See pricing',
  },
  authAlerts: {
    success: 'Magic link confirmed. You’re signed in.',
    missingCode: 'Missing auth code in the callback URL.',
    errorPrefix: 'Sign-in issue:',
    errorFallback: 'Unable to complete the login.',
  },
} as const
