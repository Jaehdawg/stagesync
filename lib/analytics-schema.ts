export type AnalyticsEventField = {
  name: string
  required: boolean
  description: string
}

export type AnalyticsEventSpec = {
  name: string
  category: string
  description: string
  requiredFields: AnalyticsEventField[]
  optionalFields: AnalyticsEventField[]
}

export type AnalyticsTrackingPlan = {
  namingConventions: string[]
  requiredMetadata: string[]
  prohibitedData: string[]
  eventSpecs: AnalyticsEventSpec[]
}

const eventSpecs: AnalyticsEventSpec[] = [
  {
    name: 'pricing.page.viewed',
    category: 'pricing',
    description: 'A visitor viewed the pricing or upgrade surface.',
    requiredFields: [
      { name: 'source', required: true, description: 'Page or surface name where the view happened.' },
      { name: 'occurredAt', required: true, description: 'Timestamp captured by the client or server.' },
    ],
    optionalFields: [
      { name: 'bandId', required: false, description: 'Associated band when the page is band-scoped.' },
      { name: 'plan', required: false, description: 'Plan or tier being shown.' },
    ],
  },
  {
    name: 'pricing.cta.clicked',
    category: 'pricing',
    description: 'A pricing or conversion CTA was clicked.',
    requiredFields: [
      { name: 'source', required: true, description: 'The CTA location or page section.' },
      { name: 'next', required: true, description: 'The destination or next step after the click.' },
      { name: 'occurredAt', required: true, description: 'Timestamp of the click.' },
    ],
    optionalFields: [
      { name: 'bandId', required: false, description: 'Associated band, if known.' },
    ],
  },
  {
    name: 'trial.started',
    category: 'pricing',
    description: 'A user started a free-trial or band onboarding flow.',
    requiredFields: [
      { name: 'source', required: true, description: 'The surface where the trial start originated.' },
      { name: 'occurredAt', required: true, description: 'Timestamp of the start event.' },
    ],
    optionalFields: [
      { name: 'bandId', required: false, description: 'The band being onboarded.' },
    ],
  },
  {
    name: 'pricing.checkout.started',
    category: 'pricing',
    description: 'A checkout flow was launched from the pricing surface.',
    requiredFields: [
      { name: 'source', required: true, description: 'Entry surface for the checkout action.' },
      { name: 'product', required: true, description: 'Subscription or per-event credit product being purchased.' },
      { name: 'occurredAt', required: true, description: 'Timestamp of the event.' },
    ],
    optionalFields: [
      { name: 'bandId', required: false, description: 'Band associated with the checkout.' },
      { name: 'showId', required: false, description: 'Specific show or access window tied to the checkout.' },
    ],
  },
  {
    name: 'pricing.checkout.completed',
    category: 'pricing',
    description: 'A hosted checkout completed successfully.',
    requiredFields: [
      { name: 'source', required: true, description: 'Checkout surface or route.' },
      { name: 'product', required: true, description: 'Purchased subscription or credit product.' },
      { name: 'occurredAt', required: true, description: 'Timestamp of completion.' },
    ],
    optionalFields: [
      { name: 'bandId', required: false, description: 'Band that received the purchase.' },
      { name: 'provider', required: false, description: 'Hosted billing provider name.' },
      { name: 'providerReference', required: false, description: 'Stripe session, payment, or subscription reference.' },
    ],
  },
  {
    name: 'show.created',
    category: 'show',
    description: 'A new show was created or reopened.',
    requiredFields: [
      { name: 'bandId', required: true, description: 'Owning band.' },
      { name: 'showId', required: true, description: 'Event or show identifier.' },
      { name: 'occurredAt', required: true, description: 'Timestamp of the action.' },
    ],
    optionalFields: [
      { name: 'source', required: false, description: 'Where the show creation originated.' },
    ],
  },
  {
    name: 'show.started',
    category: 'show',
    description: 'A live show started or resumed inside a paid window.',
    requiredFields: [
      { name: 'bandId', required: true, description: 'Owning band.' },
      { name: 'showId', required: true, description: 'Event or show identifier.' },
      { name: 'occurredAt', required: true, description: 'Timestamp of the action.' },
    ],
    optionalFields: [
      { name: 'restartCount', required: false, description: 'Number of restarts inside the current paid window.' },
      { name: 'isPaidWindow', required: false, description: 'Whether the show is inside a paid access window.' },
    ],
  },
  {
    name: 'show.paused',
    category: 'show',
    description: 'A show was paused and entered undo grace.',
    requiredFields: [
      { name: 'bandId', required: true, description: 'Owning band.' },
      { name: 'showId', required: true, description: 'Event or show identifier.' },
      { name: 'occurredAt', required: true, description: 'Timestamp of the pause.' },
    ],
    optionalFields: [
      { name: 'undoGraceUntil', required: false, description: 'Undo window expiry timestamp.' },
    ],
  },
  {
    name: 'show.ended',
    category: 'show',
    description: 'A show ended and signups closed.',
    requiredFields: [
      { name: 'bandId', required: true, description: 'Owning band.' },
      { name: 'showId', required: true, description: 'Event or show identifier.' },
      { name: 'occurredAt', required: true, description: 'Timestamp of the end action.' },
    ],
    optionalFields: [
      { name: 'undoGraceUntil', required: false, description: 'Undo expiration when applicable.' },
    ],
  },
  {
    name: 'queue.song.requested',
    category: 'usage',
    description: 'A singer submitted or updated a song request.',
    requiredFields: [
      { name: 'bandId', required: true, description: 'Owning band.' },
      { name: 'showId', required: true, description: 'Event or show identifier.' },
      { name: 'occurredAt', required: true, description: 'Timestamp of the request.' },
    ],
    optionalFields: [
      { name: 'songId', required: false, description: 'Normalized song identifier.' },
      { name: 'sourceType', required: false, description: 'How the song was sourced.' },
    ],
  },
  {
    name: 'venue.lead.page.viewed',
    category: 'venue',
    description: 'A visitor viewed the venue sales or request-demo page.',
    requiredFields: [
      { name: 'source', required: true, description: 'The sales surface or page section.' },
      { name: 'occurredAt', required: true, description: 'Timestamp of the page view.' },
    ],
    optionalFields: [
      { name: 'bandId', required: false, description: 'Band or venue context, if known.' },
    ],
  },
  {
    name: 'venue.lead.created',
    category: 'venue',
    description: 'A venue lead or contact was created.',
    requiredFields: [
      { name: 'occurredAt', required: true, description: 'Timestamp of the lead capture.' },
      { name: 'source', required: true, description: 'Lead source or capture path.' },
    ],
    optionalFields: [
      { name: 'bandId', required: false, description: 'Band associated with the lead.' },
      { name: 'venueName', required: false, description: 'Venue name, when safe to store.' },
    ],
  },
  {
    name: 'venue.lead.converted',
    category: 'venue',
    description: 'A venue inquiry converted to a qualified or sales-ready lead.',
    requiredFields: [
      { name: 'occurredAt', required: true, description: 'Timestamp of the conversion.' },
      { name: 'source', required: true, description: 'The originating lead flow or source.' },
    ],
    optionalFields: [
      { name: 'bandId', required: false, description: 'Band associated with the lead.' },
      { name: 'venueName', required: false, description: 'Venue name, when safe to store.' },
    ],
  },
  {
    name: 'subscription.started',
    category: 'billing',
    description: 'A subscription checkout or activation started.',
    requiredFields: [
      { name: 'bandId', required: true, description: 'Owning band.' },
      { name: 'occurredAt', required: true, description: 'Timestamp of the start event.' },
      { name: 'source', required: true, description: 'Where the start originated.' },
    ],
    optionalFields: [
      { name: 'provider', required: false, description: 'Billing provider name.' },
      { name: 'providerReference', required: false, description: 'Checkout or subscription reference.' },
    ],
  },
  {
    name: 'subscription.churned',
    category: 'billing',
    description: 'A subscription was canceled, paused, or otherwise churned.',
    requiredFields: [
      { name: 'bandId', required: true, description: 'Owning band.' },
      { name: 'occurredAt', required: true, description: 'Timestamp of the churn event.' },
      { name: 'source', required: true, description: 'Where the churn was observed.' },
    ],
    optionalFields: [
      { name: 'provider', required: false, description: 'Billing provider name.' },
      { name: 'providerReference', required: false, description: 'Subscription reference.' },
    ],
  },
]

export function getAnalyticsTrackingPlan(): AnalyticsTrackingPlan {
  return {
    namingConventions: [
      'Use lowercase dotted names in the form area.action or area.entity.action.',
      'Keep names stable and avoid per-screen suffixes that fragment reporting.',
      'Prefer business events over UI click events.',
      'Use semantic product names such as pricing.checkout.started instead of generic verbs.',
    ],
    requiredMetadata: [
      'occurredAt timestamp',
      'source surface or origin',
      'bandId whenever the event is band-scoped',
      'showId or entityId when the event refers to a specific object',
      'actorRole or system actor classification',
    ],
    prohibitedData: [
      'raw card numbers, CVC, or any payment instrument secret',
      'passwords, API keys, session tokens, or OAuth credentials',
      'email bodies, private message content, or lyrics text',
      'unnecessary PII such as phone numbers or home addresses',
      'freeform notes that can contain sensitive user-entered text',
    ],
    eventSpecs,
  }
}

export function getAnalyticsEventNames() {
  return eventSpecs.map((event) => event.name)
}

export function getAnalyticsProhibitedData() {
  return getAnalyticsTrackingPlan().prohibitedData
}
