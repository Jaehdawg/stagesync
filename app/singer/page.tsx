import { redirect } from 'next/navigation'
import { createClient } from '../../utils/supabase/server'
import { createServiceClient } from '../../utils/supabase/service'
import { SingerDashboardView } from '../../components/singer-dashboard-view'
import { slugifyBandName } from '../../lib/public-links'
import { getBandProfileForBandId } from '../../lib/band-tenancy'
import { getBandTidalCredentials } from '../../lib/band-tidal'
import { getShowState, getSignupCapacity } from '../../lib/show-state'
import { singerCopy } from '@/content/en/singer'
import { sharedCopy } from '@/content/en/shared'

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
  const serviceSupabase = createServiceClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const params = await searchParams
  const bandSlug = firstParam(params?.band)?.trim().toLowerCase() ?? ''
  const requestedShowId = firstParam(params?.show)?.trim() ?? ''

  if (!bandSlug) {
    redirect('/')
  }

  const { data: bands } = await serviceSupabase.from('bands').select('id, band_name')
  const band = (bands ?? []).find((row) => slugifyBandName(row.band_name ?? '') === bandSlug) ?? null

  if (!band) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-200">
          {singerCopy.noBandFound}
        </div>
      </main>
    )
  }

  const hasTidalCredentials = Boolean(await getBandTidalCredentials(serviceSupabase, band.id))

  const activeShowResult = requestedShowId
    ? null
    : await serviceSupabase
        .from('events')
        .select('id, band_id, name, is_active, allow_signups')
        .eq('band_id', band.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)

  const activeShow = activeShowResult?.data?.[0] ?? null
  const showId = requestedShowId || activeShow?.id || ''

  if (!showId) {
    const bandProfile = await getBandProfileForBandId(serviceSupabase, band.id)
    const fallbackBandProfile = bandProfile ?? {
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
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{singerCopy.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">{singerCopy.noActiveShow.title}</h1>
          <p className="mt-3 text-slate-300">{singerCopy.noActiveShow.body(fallbackBandProfile.band_name)}</p>
          <a href="/band" className="mt-6 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white hover:border-cyan-400/50">
            {singerCopy.noActiveShow.backToBandPortal}
          </a>
        </div>
      </main>
    )
  }

  const [bandProfile, showResult, settingsResult, queueResult] = await Promise.all([
    getBandProfileForBandId(serviceSupabase, band.id),
    serviceSupabase
      .from('events')
      .select('id, band_id, name, is_active, allow_signups')
      .eq('id', showId)
      .eq('band_id', band.id)
      .maybeSingle(),
    serviceSupabase
      .from('show_settings')
      .select('show_duration_minutes, signup_buffer_minutes, song_source_mode, request_mode_enabled, request_source_mode, tidal_playlist_url')
      .eq('event_id', showId)
      .maybeSingle(),
    serviceSupabase
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
      ? serviceSupabase.from('songs').select('id, title, artist').in('id', songIds).eq('band_id', band.id)
      : Promise.resolve({ data: [] as { id: string; title: string; artist: string }[] }),
    performerIds.length
      ? serviceSupabase.from('profiles').select('id, display_name, first_name, last_name').in('id', performerIds)
      : Promise.resolve({ data: [] as { id: string; display_name?: string | null; first_name?: string | null; last_name?: string | null }[] }),
    user
      ? serviceSupabase.from('profiles').select('id, display_name, first_name, last_name, role').eq('id', user.id).maybeSingle()
      : Promise.resolve({ data: null as { id: string; display_name?: string | null; first_name?: string | null; last_name?: string | null; role?: string | null } | null }),
  ])

  const songsById = new Map((songsResult.data ?? []).map((song) => [song.id, song]))
  const singerNamesById = new Map(
    (profilesResult.data ?? []).map((profile) => [
      profile.id,
      profile.display_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ') || sharedCopy.guestSinger,
    ])
  )

  const currentShow = showResult.data ?? null
  const showState = getShowState(currentShow)
  const signupEnabled = showState === 'active' && Boolean(currentShow?.allow_signups)
  const requestModeEnabled = settingsResult.data?.request_mode_enabled ?? false
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
      artist: song?.artist ?? sharedCopy.unknownArtist,
      title: song?.title ?? sharedCopy.unknownSong,
      singerName,
      status: item.status ?? sharedCopy.queuedStatus,
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
  const effectiveBandProfile = bandProfile ?? {
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
        bandName: effectiveBandProfile.band_name ?? band.band_name,
        websiteUrl: effectiveBandProfile.website_url,
        facebookUrl: effectiveBandProfile.facebook_url,
        instagramUrl: effectiveBandProfile.instagram_url,
        tiktokUrl: effectiveBandProfile.tiktok_url,
        paypalUrl: effectiveBandProfile.paypal_url,
        venmoUrl: effectiveBandProfile.venmo_url,
        cashappUrl: effectiveBandProfile.cashapp_url,
        customMessage: effectiveBandProfile.custom_message,
      }}
      signupEnabled={signupEnabled}
      signupStatusMessage={
        requestModeEnabled
          ? signupEnabled
            ? singerCopy.requestStatus.open(signupCapacity)
            : showState === 'paused'
              ? singerCopy.requestStatus.paused
              : singerCopy.requestStatus.ended
          : signupEnabled
            ? singerCopy.signupStatus.open(signupCapacity)
            : showState === 'paused'
              ? singerCopy.signupStatus.paused
              : singerCopy.signupStatus.ended
      }
      songSourceMode={settingsResult.data?.song_source_mode ?? 'uploaded'}
      requestModeEnabled={settingsResult.data?.request_mode_enabled ?? false}
      requestSourceMode={settingsResult.data?.request_source_mode ?? 'set_list'}
      hasTidalCredentials={hasTidalCredentials}
      tidalPlaylistUrl={settingsResult.data?.tidal_playlist_url ?? null}
      singerName={singerName}
      bandId={band.id}
      showId={currentShow?.id ?? showId}
      currentRequest={currentSingerRequest ? { artist: currentSingerRequest.artist, title: currentSingerRequest.title } : null}
      liveQueueItems={liveQueueItems}
      historyItems={historyItems}
      lyricsTrack={liveQueueItems[0] ? { artist: liveQueueItems[0].artist, title: liveQueueItems[0].title } : currentSingerRequest ? { artist: currentSingerRequest.artist, title: currentSingerRequest.title } : null}
      currentShowName={currentShow?.name ?? activeShow?.name ?? singerCopy.currentShowNameFallback}
    />
  )
}
