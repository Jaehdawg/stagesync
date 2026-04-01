import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { buildDashboardState } from '@/lib/dashboard'
import { SingerDashboardView } from '@/components/singer-dashboard-view'
import { getShowState, canSingerSignUp, getSignupCapacity } from '@/lib/show-state'
import { slugifyBandName } from '@/lib/public-links'

type SearchParams = Record<string, string | string[] | undefined>

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function SingerPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const bandSlug = firstParam(params?.band)?.trim().toLowerCase() ?? ''
  const showId = firstParam(params?.show)?.trim() ?? ''

  if (!bandSlug || !showId) {
    redirect('/')
  }

  const { data: bands } = await supabase.from('bands').select('id, band_name')
  const band = (bands ?? []).find((row) => slugifyBandName(row.band_name ?? '') === bandSlug) ?? null

  if (!band) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-200">
          We couldn’t find that band’s singer page.
        </div>
      </main>
    )
  }

  const [{ data: bandProfile }, { data: currentShow }, { data: currentSettings }, { data: queueItems }] = await Promise.all([
    supabase
      .from('band_profiles')
      .select('band_name, website_url, facebook_url, instagram_url, tiktok_url, paypal_url, venmo_url, cashapp_url, custom_message')
      .eq('band_id', band.id)
      .maybeSingle(),
    supabase
      .from('events')
      .select('id, band_id, name, is_active, allow_signups')
      .eq('id', showId)
      .eq('band_id', band.id)
      .maybeSingle(),
    supabase
      .from('show_settings')
      .select('show_duration_minutes, signup_buffer_minutes, song_source_mode, tidal_playlist_url')
      .eq('event_id', showId)
      .maybeSingle(),
    supabase
      .from('queue_items')
      .select('id, position, status, song_id, performer_id')
      .eq('band_id', band.id)
      .eq('event_id', showId)
      .order('position', { ascending: true })
      .limit(100),
  ])

  const songIds = [...new Set((queueItems ?? []).map((item) => item.song_id).filter((id): id is string => Boolean(id)))]
  const performerIds = [...new Set((queueItems ?? []).map((item) => item.performer_id).filter((id): id is string => Boolean(id)))]

  const [{ data: songs }, { data: profiles }] = await Promise.all([
    songIds.length ? supabase.from('songs').select('id, title, artist').in('id', songIds).eq('band_id', band.id) : Promise.resolve({ data: [] }),
    performerIds.length
      ? supabase.from('profiles').select('id, display_name, first_name, last_name').in('id', performerIds)
      : Promise.resolve({ data: [] }),
  ])

  const songsById = new Map((songs ?? []).map((song) => [song.id, song]))
  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))

  const showState = getShowState(currentShow)
  const signupEnabled = canSingerSignUp(currentShow)
  const signupCapacity = getSignupCapacity({
    show_duration_minutes: currentSettings?.show_duration_minutes ?? 60,
    buffer_minutes: currentSettings?.signup_buffer_minutes ?? 1,
  })

  const state = buildDashboardState({
    bandProfile: bandProfile ?? {
      band_name: band.band_name,
      custom_message: 'Thanks for singing with us — tip the band and leave a note if you want.',
    },
    activeShowCount: currentShow ? 1 : 0,
    songsInQueue: queueItems?.length ?? 0,
    queuedSingers: queueItems?.length ?? 0,
    queueItems: (queueItems ?? []).map((item, index) => {
      const song = item.song_id ? songsById.get(item.song_id) : undefined
      const performer = item.performer_id ? profilesById.get(item.performer_id) : undefined

      return {
        id: item.id,
        position: item.position ?? index + 1,
        status: item.status ?? 'Waiting',
        name:
          performer?.display_name ||
          [performer?.first_name, performer?.last_name].filter(Boolean).join(' ') ||
          'Guest singer',
        song: song ? `${song.title} - ${song.artist}` : 'Requested song',
      }
    }),
    signupEnabled,
    signupStatusMessage:
      showState === 'active'
        ? `Signups are open. Estimated signup capacity: ${signupCapacity} songs for this set.`
        : showState === 'paused'
          ? 'Signups are paused by the band.'
          : 'This show has ended and singer signups are closed.',
    currentShowId: currentShow?.id ?? showId,
    currentShowName: currentShow?.name ?? 'StageSync Show',
    showState,
    showDurationMinutes: currentSettings?.show_duration_minutes ?? 60,
    signupBufferMinutes: currentSettings?.signup_buffer_minutes ?? 1,
    songSourceMode: currentSettings?.song_source_mode ?? 'uploaded',
  })

  return <SingerDashboardView {...state} />
}
