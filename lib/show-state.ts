export type ShowState = 'active' | 'paused' | 'ended'

export type ShowStatusInput = {
  is_active?: boolean | null
  allow_signups?: boolean | null
}

export type SignupLimitInput = {
  show_duration_minutes?: number | null
  buffer_minutes?: number | null
}

export function getShowState(show: ShowStatusInput | null | undefined): ShowState {
  if (!show?.is_active) {
    return 'ended'
  }

  if (show.allow_signups === false) {
    return 'paused'
  }

  return 'active'
}

export function canSingerSignUp(show: ShowStatusInput | null | undefined) {
  return getShowState(show) === 'active'
}

export function getSignupCapacity({
  show_duration_minutes,
  buffer_minutes,
}: SignupLimitInput) {
  const duration = Math.max(show_duration_minutes ?? 0, 0)
  const buffer = Math.max(buffer_minutes ?? 0, 0)
  const effectiveMinutesPerSong = 4 + buffer

  return Math.max(Math.floor(duration / effectiveMinutesPerSong), 0)
}
