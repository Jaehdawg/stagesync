export function slugifyBandName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildSingerSignupUrl(baseUrl: string, bandSlug: string, showId?: string | null) {
  const url = new URL('/singer', baseUrl)
  url.searchParams.set('band', bandSlug)

  if (showId) {
    url.searchParams.set('show', showId)
  }

  return url.toString()
}

export function buildQrCodeImageUrl(dataUrl: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(dataUrl)}`
}
