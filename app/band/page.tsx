import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { buildDashboardState } from '@/lib/dashboard'
import { getRoleHomePath } from '@/lib/roles'
import { BandAccessForm } from '@/components/band-access-form'
import { BandDashboardView } from '@/components/band-dashboard-view'

async function getBandState(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [{ data: bandProfile }, { data: events }, { data: queueItems }] = await Promise.all([
    supabase
      .from('band_profiles')
      .select('band_name, website_url, facebook_url, instagram_url, tiktok_url, paypal_url, venmo_url, cashapp_url, custom_message')
      .limit(1)
      .maybeSingle(),
    supabase.from('events').select('id').order('created_at', { ascending: false }).limit(1),
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

  return buildDashboardState({
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
  })
}

export default async function BandPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
          <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Band portal</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">StageSync Band Login</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Band members sign in here to manage the show, queue, and profile settings.
            </p>
          </header>
          <BandAccessForm />
        </div>
      </main>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const target = getRoleHomePath(profile?.role)
  if (target !== '/band') {
    redirect(target)
  }

  const state = await getBandState(supabase)

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Band control</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">StageSync Band Dashboard</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Manage the current show, queue, and band profile without exposing those controls to singers.
          </p>
        </header>

        <BandDashboardView {...state} />
      </div>
    </main>
  )
}
