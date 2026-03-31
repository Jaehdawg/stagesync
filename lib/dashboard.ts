export type BandProfileInput = {
  band_name?: string | null
  website_url?: string | null
  facebook_url?: string | null
  instagram_url?: string | null
  tiktok_url?: string | null
  paypal_url?: string | null
  venmo_url?: string | null
  cashapp_url?: string | null
  custom_message?: string | null
}

export type QueueItemInput = {
  position?: number | null
  name?: string | null
  song?: string | null
  status?: string | null
}

export type DashboardSource = {
  bandProfile?: BandProfileInput | null
  activeShowCount?: number
  songsInQueue?: number
  queuedSingers?: number
  queueItems?: (QueueItemInput & { id?: string | null })[]
  signupEnabled?: boolean
  signupStatusMessage?: string
  currentShowId?: string | null
  currentShowName?: string | null
  showState?: 'active' | 'paused' | 'ended'
  showDurationMinutes?: number | null
  signupBufferMinutes?: number | null
}

export type DashboardState = {
  brand: {
    label: string
    title: string
    description: string
  }
  analytics: { label: string; value: string }[]
  singerActions: string[]
  queueItems: { id?: string | null; position: number; name: string; song: string; status: string }[]
  bandLinks: { label: string; href: string }[]
  paymentLinks: { label: string; href: string }[]
  customMessage: string
  signupEnabled: boolean
  signupStatusMessage: string
  currentShowId?: string | null
  currentShowName?: string | null
  showState: 'active' | 'paused' | 'ended'
  showDurationMinutes?: number | null
  signupBufferMinutes?: number | null
}

const fallbackBandLinks = [
  { label: 'Facebook', href: 'https://facebook.com' },
  { label: 'Instagram', href: 'https://instagram.com' },
  { label: 'TikTok', href: 'https://tiktok.com' },
  { label: 'Website', href: 'https://example.com' },
]

const fallbackQueueItems = [
  { position: 1, name: 'Maya Chen', song: 'Dreams - Fleetwood Mac', status: 'Singing now' },
  { position: 2, name: 'Jordan Lee', song: 'Mr. Brightside - The Killers', status: 'Up next' },
  { position: 3, name: 'Sam Rivera', song: 'Shallow - Lady Gaga & Bradley Cooper', status: 'Waiting' },
]

const singerActions = [
  'Quick registration with first, last, and email',
  'Tidal search with playlist/full catalog toggle',
  'Live queue position tracking',
  'Lyrics view',
  'Tip links and custom band message',
]

export function buildDashboardState(source: DashboardSource = {}): DashboardState {
  const bandName = source.bandProfile?.band_name?.trim() || 'StageSync'
  const activeShows = source.activeShowCount ?? 12
  const songsInQueue = source.songsInQueue ?? (source.queueItems?.length ?? 38)
  const queuedSingers = source.queuedSingers ?? 24

  const bandLinks = [
    { label: 'Facebook', href: source.bandProfile?.facebook_url?.trim() || fallbackBandLinks[0].href },
    { label: 'Instagram', href: source.bandProfile?.instagram_url?.trim() || fallbackBandLinks[1].href },
    { label: 'TikTok', href: source.bandProfile?.tiktok_url?.trim() || fallbackBandLinks[2].href },
    { label: 'Website', href: source.bandProfile?.website_url?.trim() || fallbackBandLinks[3].href },
  ]

  const paymentLinks = [
    {
      label: 'PayPal',
      href: source.bandProfile?.paypal_url?.trim() || 'https://paypal.com',
    },
    {
      label: 'Venmo',
      href: source.bandProfile?.venmo_url?.trim() || 'https://venmo.com',
    },
    {
      label: 'CashApp',
      href: source.bandProfile?.cashapp_url?.trim() || 'https://cash.app',
    },
  ]

  return {
    brand: {
      label: 'StageSync',
      title: bandName,
      description:
        'Live karaoke queueing for singers, bands, and admins — built to handle fast registration, Tidal search, queue control, lyrics, tips, and band profile visibility from one dashboard.',
    },
    analytics: [
      { label: 'Active Show', value: activeShows > 0 ? '🤘' : '⛔️' },
      { label: 'Songs in queue', value: String(songsInQueue) },
      { label: 'Queued singers', value: String(queuedSingers) },
    ],
    singerActions,
    queueItems: (source.queueItems?.length ? source.queueItems : fallbackQueueItems).map((item, index) => ({
      position: item.position ?? index + 1,
      name: item.name?.trim() || fallbackQueueItems[index % fallbackQueueItems.length].name,
      song: item.song?.trim() || fallbackQueueItems[index % fallbackQueueItems.length].song,
      status: item.status?.trim() || fallbackQueueItems[index % fallbackQueueItems.length].status,
    })),
    bandLinks,
    paymentLinks,
    customMessage:
      source.bandProfile?.custom_message?.trim() ||
      'Thanks for singing with us — tip the band and leave a note if you want.',
    signupEnabled: source.signupEnabled ?? true,
    signupStatusMessage:
      source.signupStatusMessage ?? 'Sign up while the show is active to add songs to the queue.',
    currentShowId: source.currentShowId ?? null,
    currentShowName: source.currentShowName ?? null,
    showState: source.showState ?? 'ended',
    showDurationMinutes: source.showDurationMinutes ?? null,
    signupBufferMinutes: source.signupBufferMinutes ?? null,
  }
}
