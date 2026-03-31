import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { buildDashboardState } from '@/lib/dashboard'
import { SingerDashboardView } from '@/components/singer-dashboard-view'
import { getRoleHomePath } from '@/lib/roles'
import { canSingerSignUp, getShowState, getSignupCapacity } from '@/lib/show-state'
import { buildRootAuthRedirect } from '@/lib/root-auth'

type SearchParams = Record<string, string | string[] | undefined>

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const auth = typeof params?.auth === 'string' ? params.auth : undefined
  const message = typeof params?.message === 'string' ? params.message : undefined

  const code = typeof params?.code === 'string' ? params.code : undefined
  const role = typeof params?.role === 'string' ? params.role : undefined

  const requestHeaders = await headers()
  const forwardedProto = requestHeaders.get('x-forwarded-proto') ?? 'https'
  const forwardedHost = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  const siteUrl = requestHeaders.get('origin') ?? (forwardedHost ? `${forwardedProto}://${forwardedHost}` : undefined)

  const authRedirect = buildRootAuthRedirect({
    code,
    role,
    siteUrl: siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? 'https://stagesync-six.vercel.app',
  })

  if (authRedirect) {
    redirect(authRedirect)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const target = getRoleHomePath(profile?.role)

    if (target !== '/') {
      redirect(target)
    }
  }

  const [{ data: bandProfile }, { data: events }, { data: queueItems }] = await Promise.all([
    supabase
      .from('band_profiles')
      .select('band_name, website_url, facebook_url, instagram_url, tiktok_url, paypal_url, venmo_url, cashapp_url, custom_message')
      .limit(1)
      .maybeSingle(),
    supabase.from('events').select('id, name, is_active, allow_signups').order('created_at', { ascending: false }).limit(1),
    supabase
      .from('queue_items')
      .select('position, status, song_id, performer_id')
      .order('position', { ascending: true })
      .limit(6),
  ])

  const songIds = [...new Set((queueItems ?? []).map((item) => item.song_id).filter((id): id is string => Boolean(id)))]
  const performerIds = [
    ...new Set((queueItems ?? []).map((item) => item.performer_id).filter((id): id is string => Boolean(id))),
  ]

  const [{ data: songs }, { data: profiles }] = await Promise.all([
    songIds.length
      ? supabase.from('songs').select('id, title, artist').in('id', songIds)
      : Promise.resolve({ data: [] }),
    performerIds.length
      ? supabase.from('profiles').select('id, display_name, first_name, last_name').in('id', performerIds)
      : Promise.resolve({ data: [] }),
  ])

  const songsById = new Map((songs ?? []).map((song) => [song.id, song]))
  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
  const currentShow = events?.[0]
  const showState = getShowState(currentShow)
  const signupEnabled = canSingerSignUp(currentShow)
  const showSettingsResponse = currentShow?.id
    ? await supabase
        .from('show_settings')
        .select('show_duration_minutes, signup_buffer_minutes, song_source_mode, tidal_playlist_url')
        .eq('event_id', currentShow.id)
        .maybeSingle()
    : { data: null }
  const showDurationMinutes = showSettingsResponse.data?.show_duration_minutes ?? 60
  const signupBufferMinutes = showSettingsResponse.data?.signup_buffer_minutes ?? 1
  const signupCapacity = getSignupCapacity({
    show_duration_minutes: showDurationMinutes,
    buffer_minutes: signupBufferMinutes,
  })

  const state = buildDashboardState({
    bandProfile,
    activeShowCount: events?.length ?? 0,
    songsInQueue: queueItems?.length ?? 0,
    queuedSingers: queueItems?.length ?? 0,
    queueItems: queueItems?.map((item, index) => {
      const song = item.song_id ? songsById.get(item.song_id) : undefined
      const performer = item.performer_id ? profilesById.get(item.performer_id) : undefined

      return {
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
          ? 'Signups are currently paused by the band.'
          : 'This show has ended, so new signups are closed.',
    currentShowId: currentShow?.id ?? null,
    currentShowName: currentShow?.name ?? null,
    showState,
    showDurationMinutes,
    signupBufferMinutes,
    songSourceMode: showSettingsResponse.data?.song_source_mode ?? 'uploaded',
    tidalPlaylistUrl: showSettingsResponse.data?.tidal_playlist_url ?? null,
  })

  return (
    <>
      {auth ? (
        <div className="border-b border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-center text-sm text-cyan-100">
          {auth === 'success' ? 'Magic link confirmed. You’re signed in.' : null}
          {auth === 'missing-code' ? 'Missing auth code in the callback URL.' : null}
          {auth === 'error' ? `Sign-in issue: ${message ?? 'Unable to complete the login.'}` : null}
        </div>
      ) : null}
      <SingerDashboardView {...state} />
    </>
  )
}
