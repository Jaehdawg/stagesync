import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { SingerDashboardView } from '@/components/singer-dashboard-view'
import { slugifyBandName } from '@/lib/public-links'
import { getShowState, getSignupCapacity } from '@/lib/show-state'

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
  const {
    data: { user },
  } = await supabase.auth.getUser()
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

  const [bandProfileResult, showResult, settingsResult, queueResult] = await Promise.all([
    supabase
      .from('band_profiles')
      .select('band_name, website_url, facebook_url, instagram_url, tiktok_url, paypal_url, venmo_url, cashapp_url, custom_message')
      .eq('band_id', band.id)
      .maybeSingle(),
    supabase
      .from('test_shows')
      .select('id, band_id, name, is_active, allow_signups')
      .eq('id', showId)
      .eq('band_id', band.id)
      .maybeSingle(),
    supabase
      .from('test_show_settings')
      .select('show_duration_minutes, signup_buffer_minutes, song_source_mode, tidal_playlist_url')
      .eq('event_id', showId)
      .maybeSingle(),
    supabase
      .from('queue_items')
      .select('id, event_id, performer_id, song_id, status, position, created_at')
      .eq('band_id', band.id)
      .eq('event_id', showId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(200),
  ])

  const queueItems = queueResult.data ?? []
  const songIds = [...new Set(queueItems.map((item) => item.song_id).filter((id): id is string => Boolean(id)))]
  const performerIds = [...new Set(queueItems.map((item) => item.performer_id).filter((id): id is string => Boolean(id)))]

  const [songsResult, profilesResult, singerProfile] = await Promise.all([
    songIds.length
      ? supabase.from('songs').select('id, title, artist').in('id', songIds).eq('band_id', band.id)
      : Promise.resolve({ data: [] as { id: string; title: string; artist: string }[] }),
    performerIds.length
      ? supabase.from('profiles').select('id, display_name, first_name, last_name').in('id', performerIds)
      : Promise.resolve({ data: [] as { id: string; display_name?: string | null; first_name?: string | null; last_name?: string | null }[] }),
    user
      ? supabase.from('profiles').select('id, display_name, first_name, last_name, role').eq('id', user.id).maybeSingle()
      : Promise.resolve({ data: null as { id: string; display_name?: string | null; first_name?: string | null; last_name?: string | null; role?: string | null } | null }),
  ])

  const songsById = new Map((songsResult.data ?? []).map((song) => [song.id, song]))
  const singerNamesById = new Map(
    (profilesResult.data ?? []).map((profile) => [
      profile.id,
      profile.display_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Guest singer',
    ])
  )

  const currentShow = showResult.data ?? null
  const showState = getShowState(currentShow)
  const signupEnabled = showState === 'active' && Boolean(currentShow?.allow_signups)
  const signupCapacity = getSignupCapacity({
    show_duration_minutes: settingsResult.data?.show_duration_minutes ?? 60,
    buffer_minutes: settingsResult.data?.signup_buffer_minutes ?? 1,
  })

  const decoratedQueue = queueItems.map((item) => {
    const song = item.song_id ? songsById.get(item.song_id) : undefined
    const singerName = item.performer_id ? singerNamesById.get(item.performer_id) : undefined
    return {
      id: item.id,
      position: item.position ?? 0,
      artist: song?.artist ?? 'Unknown artist',
      title: song?.title ?? 'Unknown song',
      singerName,
      status: item.status ?? 'queued',
      createdAt: item.created_at ?? null,
      performerId: item.performer_id,
    }
  })

  const liveQueueItems = decoratedQueue.filter((item) => !['played', 'cancelled'].includes(item.status))
  const historyItems = decoratedQueue.filter((item) => ['played', 'cancelled'].includes(item.status))
  const currentSingerRequest = decoratedQueue.find((item) => item.performerId === user?.id && !['played', 'cancelled'].includes(item.status))
  const singerName = singerProfile.data
    ? singerProfile.data.display_name || [singerProfile.data.first_name, singerProfile.data.last_name].filter(Boolean).join(' ') || null
    : null
  const bandProfile = bandProfileResult.data ?? {
    band_name: band.band_name,
    website_url: null,
    facebook_url: null,
    instagram_url: null,
    tiktok_url: null,
    paypal_url: null,
    venmo_url: null,
    cashapp_url: null,
    custom_message: null,
  }

  return (
    <SingerDashboardView
      bandProfile={{
        bandName: bandProfile.band_name ?? band.band_name,
        websiteUrl: bandProfile.website_url,
        facebookUrl: bandProfile.facebook_url,
        instagramUrl: bandProfile.instagram_url,
        tiktokUrl: bandProfile.tiktok_url,
        paypalUrl: bandProfile.paypal_url,
        venmoUrl: bandProfile.venmo_url,
        cashappUrl: bandProfile.cashapp_url,
        customMessage: bandProfile.custom_message,
      }}
      signupEnabled={signupEnabled}
      signupStatusMessage={
        signupEnabled
          ? `Signups are open. Singer Slots: ${signupCapacity}`
          : showState === 'paused'
            ? 'Signups are paused by the band.'
            : 'This show has ended and singer signups are closed.'
      }
      songSourceMode={settingsResult.data?.song_source_mode === 'tidal_playlist' ? 'tidal_playlist' : 'uploaded'}
      tidalPlaylistUrl={settingsResult.data?.tidal_playlist_url ?? null}
      singerName={singerName}
      bandId={band.id}
      showId={currentShow?.id ?? showId}
      currentRequest={currentSingerRequest ? { artist: currentSingerRequest.artist, title: currentSingerRequest.title } : null}
      liveQueueItems={liveQueueItems}
      historyItems={historyItems}
      lyricsTrack={currentSingerRequest ? { artist: currentSingerRequest.artist, title: currentSingerRequest.title } : liveQueueItems[0] ? { artist: liveQueueItems[0].artist, title: liveQueueItems[0].title } : null}
      currentShowName={currentShow?.name ?? 'StageSync Show'}
    />
  )
}
