import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { buildDashboardState } from '@/lib/dashboard'
import { canSingerSignUp, getShowState, getSignupCapacity } from '@/lib/show-state'
import { BandAccessForm } from '@/components/band-access-form'
import { BandDashboardView, type BandDashboardState } from '@/components/band-dashboard-view'
import { getTestSession } from '@/lib/test-session'
import { getLatestTestShow, getLatestTestShowSettings } from '@/lib/test-show'
import { getTestBandProfileByBandId } from '@/lib/test-band-profile'
import { getTestLogin } from '@/lib/test-login-list'
import { getBandProfileForBandId } from '@/lib/band-tenancy'
import { getLiveBandAccessContext } from '@/lib/band-access'
import { listBandRolesForProfileId } from '@/lib/band-roles'
import { AutoRefresh } from '@/components/auto-refresh'
import { headers } from 'next/headers'
import { buildSingerSignupUrl, slugifyBandName } from '@/lib/public-links'

async function getBandState(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bandId?: string | null,
  bandProfileOverride?: {
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
) {
  type QueueRow = { id: string; position: number | null; status: string | null; song_id: string | null; performer_id: string | null }

  const bandProfile = bandId
    ? await getBandProfileForBandId(supabase, bandId)
    : (await supabase.from('band_profiles').select('band_name, website_url, facebook_url, instagram_url, tiktok_url, paypal_url, venmo_url, cashapp_url, custom_message').limit(1).maybeSingle()).data ?? null

  const [activeEventsResult, latestEventsResult, queueItemsResult] = await Promise.all([
    bandId
      ? supabase.from('events').select('id, name, band_id, is_active, allow_signups').eq('band_id', bandId).eq('is_active', true).order('created_at', { ascending: false }).limit(1)
      : Promise.resolve({ data: [] as { id: string; name: string | null; band_id: string | null; is_active: boolean | null; allow_signups: boolean | null }[] }),
    bandId
      ? supabase.from('events').select('id, name, band_id, is_active, allow_signups').eq('band_id', bandId).order('created_at', { ascending: false }).limit(1)
      : supabase.from('events').select('id, name, band_id, is_active, allow_signups').order('created_at', { ascending: false }).limit(1),
    bandId
      ? supabase
          .from('queue_items')
          .select('id, position, status, song_id, performer_id')
          .eq('band_id', bandId)
          .order('position', { ascending: true })
          .limit(200)
      : supabase
          .from('queue_items')
          .select('id, position, status, song_id, performer_id')
          .order('position', { ascending: true })
          .limit(200),
  ])

  const activeEvents = activeEventsResult.data ?? []
  const events = activeEvents.length ? activeEvents : (latestEventsResult.data ?? [])
  const queueItems = queueItemsResult.data ?? []
  const currentShow = events[0]
  const currentSettings = currentShow?.id
    ? await supabase
        .from('show_settings')
        .select('show_duration_minutes, signup_buffer_minutes, song_source_mode, tidal_playlist_url')
        .eq('event_id', currentShow.id)
        .maybeSingle()
    : { data: null }
  const showDurationMinutes = currentSettings.data?.show_duration_minutes ?? 60
  const signupBufferMinutes = currentSettings.data?.signup_buffer_minutes ?? 1

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
  const showState = getShowState(currentShow)
  const signupEnabled = canSingerSignUp(currentShow)
  const signupCapacity = getSignupCapacity({
    show_duration_minutes: showDurationMinutes,
    buffer_minutes: signupBufferMinutes,
  })
  const decoratedQueueItems = ((queueItems ?? []) as QueueRow[]).map((item, index) => {
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
  })
  const liveQueueCount = decoratedQueueItems.filter((item) => !['played', 'cancelled'].includes(item.status)).length

  return buildDashboardState({
    bandProfile: bandProfileOverride ?? bandProfile,
    activeShowCount: events?.length ?? 0,
    songsInQueue: liveQueueCount,
    queuedSingers: liveQueueCount,
    queueItems: decoratedQueueItems,
    signupEnabled,
    signupStatusMessage:
      showState === 'active'
        ? `Signups are open. Estimated signup capacity: ${signupCapacity} songs for this set.`
        : showState === 'paused'
          ? 'Signups are paused by the band.'
          : 'This show has ended and singer signups are closed.',
    currentShowId: currentShow?.id ?? null,
    currentShowName: currentShow?.name ?? null,
    showState,
    showDurationMinutes,
    signupBufferMinutes,
    songSourceMode: currentSettings.data?.song_source_mode ?? 'uploaded',
  })
}

async function getBandTestState(supabase: Awaited<ReturnType<typeof createClient>>): Promise<BandDashboardState> {
  const testSession = await getTestSession()
  const activeBandId = testSession?.activeBandId ?? null
  const testBandProfile = await getTestBandProfileByBandId(supabase, activeBandId)
  const currentShow = await getLatestTestShow(supabase, activeBandId)
  const currentSettings = await getLatestTestShowSettings(supabase, activeBandId)
  const state = await getBandState(supabase, activeBandId, testBandProfile ?? undefined)

  return {
    ...state,
    currentShowId: currentShow?.id ?? null,
    currentShowName: currentShow?.name ?? 'StageSync Show',
    showState: currentShow?.is_active
      ? currentShow.allow_signups === false
        ? 'paused'
        : 'active'
      : 'ended',
    signupEnabled: Boolean(currentShow?.is_active && currentShow?.allow_signups),
    signupStatusMessage: currentShow
      ? currentShow.is_active
        ? currentShow.allow_signups === false
          ? 'Signups are paused by the band.'
          : 'Signups are open for the test show.'
        : 'This show has ended and singer signups are closed.'
      : 'No show exists yet. Create one to begin.',
    showDurationMinutes: currentSettings?.show_duration_minutes ?? 60,
    signupBufferMinutes: currentSettings?.signup_buffer_minutes ?? 1,
    songSourceMode: currentSettings?.song_source_mode === 'tidal_playlist' ? 'tidal_playlist' : 'uploaded',
  }
}

export default async function BandPage() {
  const testSession = await getTestSession()
  const supabase = await createClient()
  const serviceSupabase = createServiceClient()
  const requestHeaders = await headers()
  const forwardedProto = requestHeaders.get('x-forwarded-proto') ?? 'https'
  const forwardedHost = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  const siteUrl = requestHeaders.get('origin') ?? (forwardedHost ? `${forwardedProto}://${forwardedHost}` : undefined)
  const appUrl = siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? 'https://stagesync-six.vercel.app'

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await serviceSupabase.from('profiles').select('role, active_band_id').eq('id', user.id).maybeSingle()
    const userRole = profile?.role ?? 'band'
    const liveBandId = userRole === 'band'
      ? profile?.active_band_id ?? (await listBandRolesForProfileId(serviceSupabase, user.id)).find((role) => role.active)?.band_id ?? null
      : null

    if (userRole === 'band' && liveBandId) {
      const liveAccess = await getLiveBandAccessContext(supabase, serviceSupabase, { requireAdmin: false })
      if (liveAccess) {
        const state = await getBandState(serviceSupabase, liveBandId)
        const singerSignupUrl = buildSingerSignupUrl(appUrl, slugifyBandName(state.brand.title))

        return (
          <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
              <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Band control</p>
                <h1 className="mt-2 text-4xl font-semibold text-white">StageSync Band Dashboard</h1>
                <p className="mt-3 max-w-2xl text-slate-300">
                  Logged in as <span className="font-semibold">{liveAccess.username}</span>.
                </p>
                {liveAccess.bandRole === 'admin' ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <a href="/band/account" className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white hover:border-cyan-400/50">Account</a>
                    <a href="/band/members" className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white hover:border-cyan-400/50">Members</a>
                    <a href="/band/songs" className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white hover:border-cyan-400/50">Song library</a>
                  </div>
                ) : null}
                <form className="mt-4" action="/api/auth/logout" method="post">
                  <button type="submit" className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white hover:border-cyan-400/50">
                    Log out
                  </button>
                </form>
              </header>

              <BandDashboardView {...state} bandAccessLevel={liveAccess.bandRole} singerSignupUrl={singerSignupUrl} />
              <AutoRefresh enabled intervalMs={5000} />
            </div>
          </main>
        )
      }
    }
  }

  if (testSession?.role === 'band') {
    const state = await getBandTestState(serviceSupabase)
    const currentBandLogin = await getTestLogin(serviceSupabase, testSession.username)
    const isBandAdmin = currentBandLogin?.band_access_level !== 'member'
    const singerSignupUrl = buildSingerSignupUrl(appUrl, slugifyBandName(state.brand.title))

    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Band control</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">StageSync Band Dashboard</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Logged in as <span className="font-semibold">{testSession.username}</span>.
            </p>
            {isBandAdmin ? (
              <div className="mt-4 flex flex-wrap gap-3">
                <a href="/band/account" className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white hover:border-cyan-400/50">Account</a>
                <a href="/band/members" className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white hover:border-cyan-400/50">Members</a>
                <a href="/band/songs" className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white hover:border-cyan-400/50">Song library</a>
              </div>
            ) : null}
            <form className="mt-4" action="/api/auth/logout" method="post">
              <button type="submit" className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white hover:border-cyan-400/50">
                Log out
              </button>
            </form>
          </header>

          <BandDashboardView {...state} testMode bandAccessLevel={isBandAdmin ? 'admin' : 'member'} singerSignupUrl={singerSignupUrl} />
          <AutoRefresh enabled intervalMs={5000} />
        </div>
      </main>
    )
  }


  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
          <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Band portal</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">StageSync Band Login</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Band members sign in here with a username and password to manage the show, queue, and profile settings.
            </p>
          </header>
          <BandAccessForm
            role="band"
            title="Band login"
            description="Use your band username and password to access show controls."
            submitLabel="Sign in"
            successMessage="Band login successful."
          />
        </div>
      </main>
    )
  }

  const { data: profile } = user
    ? await serviceSupabase.from('profiles').select('role, active_band_id').eq('id', user.id).maybeSingle()
    : { data: { role: 'band', active_band_id: null } }

  const userRole = user ? profile?.role : 'band'
  const liveBandId = user && userRole === 'band'
    ? profile?.active_band_id ?? (await listBandRolesForProfileId(serviceSupabase, user.id)).find((role) => role.active)?.band_id ?? null
    : null

  if (userRole !== 'band') {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
          <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Band portal</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">Switch to a band account</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              You&apos;re currently signed in as a singer. Use a band email to get the band dashboard.
            </p>
          </header>
          <BandAccessForm
            role="band"
            title="Band login"
            description="Use your band username and password to switch into the band dashboard."
            submitLabel="Sign in"
            successMessage="Band login successful."
          />
        </div>
      </main>
    )
  }

  const state = await getBandState(serviceSupabase, testSession?.activeBandId ?? liveBandId)
  const singerSignupUrl = buildSingerSignupUrl(appUrl, slugifyBandName(state.brand.title))

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Band control</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">StageSync Band Dashboard</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Manage the current show, queue, and band profile without exposing those controls to singers.
          </p>
          <form className="mt-4" action="/api/auth/logout" method="post">
            <button type="submit" className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white hover:border-cyan-400/50">
              Log out
            </button>
          </form>
        </header>

        <BandDashboardView {...state} singerSignupUrl={singerSignupUrl} />
      </div>
    </main>
  )
}
