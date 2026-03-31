import { createClient } from '@/utils/supabase/server'
import { buildDashboardState } from '@/lib/dashboard'
import { DashboardView } from '@/components/dashboard-view'

type SearchParams = Record<string, string | string[] | undefined>

type QueueItemRow = {
  position: number | null
  status: string | null
  song_id: string | null
  performer_id: string | null
}

type SongRow = {
  id: string
  title: string
  artist: string
}

type ProfileRow = {
  id: string
  display_name: string | null
  first_name: string | null
  last_name: string | null
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const auth = typeof params?.auth === 'string' ? params.auth : undefined
  const message = typeof params?.message === 'string' ? params.message : undefined

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
      : Promise.resolve({ data: [] as SongRow[] }),
    performerIds.length
      ? supabase.from('profiles').select('id, display_name, first_name, last_name').in('id', performerIds)
      : Promise.resolve({ data: [] as ProfileRow[] }),
  ])

  const songsById = new Map((songs ?? []).map((song) => [song.id, song]))
  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))

  const state = buildDashboardState({
    bandProfile,
    activeShowCount: events?.length ?? 0,
    songsInQueue: queueItems?.length ?? 0,
    queuedSingers: queueItems?.length ?? 0,
    queueItems: queueItems?.map((item: QueueItemRow, index) => {
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

  return (
    <>
      {auth ? (
        <div className="border-b border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-center text-sm text-cyan-100">
          {auth === 'success' ? 'Magic link confirmed. You’re signed in.' : null}
          {auth === 'missing-code' ? 'Missing auth code in the callback URL.' : null}
          {auth === 'error' ? `Sign-in issue: ${message ?? 'Unable to complete the login.'}` : null}
        </div>
      ) : null}
      <DashboardView {...state} />
    </>
  )
}
