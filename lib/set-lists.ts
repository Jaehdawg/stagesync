import { createServiceClient } from '@/utils/supabase/service'

export type BandSetListRow = {
  id: string
  band_id: string
  name: string
  description?: string | null
  notes?: string | null
  is_active?: boolean | null
  copied_from_set_list_id?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type BandSetListSongRow = {
  id: string
  band_id: string
  set_list_id: string
  song_id: string
  position: number
  created_at?: string | null
  updated_at?: string | null
}

function normalizeBandId(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizeId(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function assertBandId(value: unknown) {
  const bandId = normalizeBandId(value)
  if (!bandId) throw new Error('band_id is required.')
  return bandId
}

export async function listBandSetLists(bandId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('band_set_lists')
    .select('*')
    .eq('band_id', bandId)
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as BandSetListRow[]
}

export async function getBandSetListById(bandId: string, setListId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('band_set_lists')
    .select('*')
    .eq('band_id', bandId)
    .eq('id', setListId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data ?? null) as BandSetListRow | null
}

export async function getBandSetListSongs(bandId: string, setListId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('band_set_list_songs')
    .select('*')
    .eq('band_id', bandId)
    .eq('set_list_id', setListId)
    .order('position', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as BandSetListSongRow[]
}

export async function createBandSetList(
  bandIdInput: unknown,
  payload: { name: string; description?: string | null; notes?: string | null; is_active?: boolean | null }
) {
  const bandId = assertBandId(bandIdInput)
  const supabase = createServiceClient()

  const { data: created, error } = await supabase
    .from('band_set_lists')
    .insert({
      band_id: bandId,
      name: payload.name.trim(),
      description: payload.description ?? null,
      notes: payload.notes ?? null,
      is_active: payload.is_active ?? false,
    })
    .select('*')
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!created) throw new Error('Unable to create set list.')

  if (created.is_active) {
    await activateBandSetList(bandId, created.id)
  }

  return created as BandSetListRow
}

export async function updateBandSetList(
  bandIdInput: unknown,
  setListIdInput: unknown,
  payload: { name?: string; description?: string | null; notes?: string | null; is_active?: boolean | null }
) {
  const bandId = assertBandId(bandIdInput)
  const setListId = normalizeId(setListIdInput)
  if (!setListId) throw new Error('set_list_id is required.')

  const supabase = createServiceClient()
  const patch: Record<string, unknown> = {}
  if (typeof payload.name === 'string') patch.name = payload.name.trim()
  if ('description' in payload) patch.description = payload.description ?? null
  if ('notes' in payload) patch.notes = payload.notes ?? null
  if ('is_active' in payload) patch.is_active = payload.is_active ?? false

  const { data, error } = await supabase
    .from('band_set_lists')
    .update(patch)
    .eq('band_id', bandId)
    .eq('id', setListId)
    .select('*')
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Set list not found.')

  if (payload.is_active) {
    await activateBandSetList(bandId, setListId)
  }

  return data as BandSetListRow
}

export async function deleteBandSetList(bandIdInput: unknown, setListIdInput: unknown) {
  const bandId = assertBandId(bandIdInput)
  const setListId = normalizeId(setListIdInput)
  if (!setListId) throw new Error('set_list_id is required.')

  const supabase = createServiceClient()
  const { error } = await supabase.from('band_set_lists').delete().eq('band_id', bandId).eq('id', setListId)
  if (error) throw new Error(error.message)
}

export async function copyBandSetList(bandIdInput: unknown, setListIdInput: unknown, nameOverride?: string | null) {
  const bandId = assertBandId(bandIdInput)
  const setListId = normalizeId(setListIdInput)
  if (!setListId) throw new Error('set_list_id is required.')

  const source = await getBandSetListById(bandId, setListId)
  if (!source) throw new Error('Set list not found.')

  const songs = await getBandSetListSongs(bandId, setListId)
  const copyName = (nameOverride?.trim() || `${source.name} (Copy)`)

  const copied = await createBandSetList(bandId, {
    name: copyName,
    description: source.description ?? null,
    notes: source.notes ?? null,
    is_active: false,
  })

  if (songs.length) {
    await replaceBandSetListSongs(bandId, copied.id, songs.map((song) => song.song_id))
  }

  return copied
}

export async function activateBandSetList(bandIdInput: unknown, setListIdInput: unknown) {
  const bandId = assertBandId(bandIdInput)
  const setListId = normalizeId(setListIdInput)
  if (!setListId) throw new Error('set_list_id is required.')

  const supabase = createServiceClient()
  const { error: deactivateError } = await supabase.from('band_set_lists').update({ is_active: false }).eq('band_id', bandId).eq('is_active', true)
  if (deactivateError) throw new Error(deactivateError.message)

  const { data, error } = await supabase
    .from('band_set_lists')
    .update({ is_active: true })
    .eq('band_id', bandId)
    .eq('id', setListId)
    .select('*')
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Set list not found.')
  return data as BandSetListRow
}

export async function deactivateBandSetList(bandIdInput: unknown, setListIdInput: unknown) {
  const bandId = assertBandId(bandIdInput)
  const setListId = normalizeId(setListIdInput)
  if (!setListId) throw new Error('set_list_id is required.')

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('band_set_lists')
    .update({ is_active: false })
    .eq('band_id', bandId)
    .eq('id', setListId)
    .select('*')
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Set list not found.')
  return data as BandSetListRow
}

export async function replaceBandSetListSongs(bandIdInput: unknown, setListIdInput: unknown, songIds: string[]) {
  const bandId = assertBandId(bandIdInput)
  const setListId = normalizeId(setListIdInput)
  if (!setListId) throw new Error('set_list_id is required.')

  const supabase = createServiceClient()
  const normalizedSongIds = Array.from(new Set(songIds.map((songId) => normalizeId(songId)).filter((songId): songId is string => Boolean(songId))))

  const { error: deleteError } = await supabase.from('band_set_list_songs').delete().eq('band_id', bandId).eq('set_list_id', setListId)
  if (deleteError) throw new Error(deleteError.message)

  if (!normalizedSongIds.length) return [] as BandSetListSongRow[]

  const { data, error } = await supabase.from('band_set_list_songs').insert(
    normalizedSongIds.map((songId, index) => ({
      band_id: bandId,
      set_list_id: setListId,
      song_id: songId,
      position: index + 1,
    }))
  ).select('*')

  if (error) throw new Error(error.message)
  return (data ?? []) as BandSetListSongRow[]
}

export async function appendBandSetListSongs(bandIdInput: unknown, setListIdInput: unknown, songIds: string[]) {
  const bandId = assertBandId(bandIdInput)
  const setListId = normalizeId(setListIdInput)
  if (!setListId) throw new Error('set_list_id is required.')

  const supabase = createServiceClient()
  const normalizedSongIds = Array.from(new Set(songIds.map((songId) => normalizeId(songId)).filter((songId): songId is string => Boolean(songId))))
  if (!normalizedSongIds.length) return [] as BandSetListSongRow[]

  const { data: existingRows, error: selectError } = await supabase
    .from('band_set_list_songs')
    .select('song_id, position')
    .eq('band_id', bandId)
    .eq('set_list_id', setListId)
    .order('position', { ascending: true })

  if (selectError) throw new Error(selectError.message)

  const existingIds = new Set((existingRows ?? []).map((row) => row.song_id))
  const toAdd = normalizedSongIds.filter((songId) => !existingIds.has(songId))
  if (!toAdd.length) return (existingRows ?? []) as BandSetListSongRow[]

  const nextPosition = (existingRows ?? []).reduce((max, row) => Math.max(max, row.position), 0) + 1
  const { data, error } = await supabase.from('band_set_list_songs').insert(
    toAdd.map((songId, index) => ({
      band_id: bandId,
      set_list_id: setListId,
      song_id: songId,
      position: nextPosition + index,
    }))
  ).select('*')

  if (error) throw new Error(error.message)
  return [...(existingRows ?? []), ...((data ?? []) as BandSetListSongRow[])]
}

export async function removeBandSetListSong(bandIdInput: unknown, setListIdInput: unknown, songIdInput: unknown) {
  const bandId = assertBandId(bandIdInput)
  const setListId = normalizeId(setListIdInput)
  const songId = normalizeId(songIdInput)
  if (!setListId) throw new Error('set_list_id is required.')
  if (!songId) throw new Error('song_id is required.')

  const supabase = createServiceClient()
  const { data: rows, error: selectError } = await supabase
    .from('band_set_list_songs')
    .select('id, song_id, position')
    .eq('band_id', bandId)
    .eq('set_list_id', setListId)
    .order('position', { ascending: true })

  if (selectError) throw new Error(selectError.message)

  const existingRows = rows ?? []
  const removed = existingRows.find((row) => row.song_id === songId)
  if (!removed) return existingRows as BandSetListSongRow[]

  const { error: deleteError } = await supabase
    .from('band_set_list_songs')
    .delete()
    .eq('band_id', bandId)
    .eq('set_list_id', setListId)
    .eq('song_id', songId)

  if (deleteError) throw new Error(deleteError.message)

  const remainingRows = existingRows.filter((row) => row.song_id !== songId)
  for (let index = 0; index < remainingRows.length; index += 1) {
    const row = remainingRows[index]
    const position = index + 1
    if (row.position !== position) {
      const { error: updateError } = await supabase
        .from('band_set_list_songs')
        .update({ position })
        .eq('band_id', bandId)
        .eq('set_list_id', setListId)
        .eq('id', row.id)

      if (updateError) throw new Error(updateError.message)
    }
  }

  return remainingRows as BandSetListSongRow[]
}

export async function moveBandSetListSong(bandIdInput: unknown, setListIdInput: unknown, songIdInput: unknown, direction: 'up' | 'down') {
  const bandId = assertBandId(bandIdInput)
  const setListId = normalizeId(setListIdInput)
  const songId = normalizeId(songIdInput)
  if (!setListId) throw new Error('set_list_id is required.')
  if (!songId) throw new Error('song_id is required.')

  const supabase = createServiceClient()
  const { data: rows, error: selectError } = await supabase
    .from('band_set_list_songs')
    .select('id, song_id, position')
    .eq('band_id', bandId)
    .eq('set_list_id', setListId)
    .order('position', { ascending: true })

  if (selectError) throw new Error(selectError.message)

  const orderedRows = rows ?? []
  const index = orderedRows.findIndex((row) => row.song_id === songId)
  if (index < 0) return orderedRows as BandSetListSongRow[]

  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= orderedRows.length) return orderedRows as BandSetListSongRow[]

  const swapped = [...orderedRows]
  const [item] = swapped.splice(index, 1)
  swapped.splice(targetIndex, 0, item)

  for (let newIndex = 0; newIndex < swapped.length; newIndex += 1) {
    const row = swapped[newIndex]
    const position = newIndex + 1
    if (row.position !== position) {
      const { error: updateError } = await supabase
        .from('band_set_list_songs')
        .update({ position })
        .eq('band_id', bandId)
        .eq('set_list_id', setListId)
        .eq('id', row.id)

      if (updateError) throw new Error(updateError.message)
    }
  }

  return swapped as BandSetListSongRow[]
}
