import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { getRequestAdminAccess } from '@/lib/admin-access'

function escapeCsvValue(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`
  }

  return value
}

function buildCsv(rows: Array<{ rollup_date: string; band_id: string | null; metric_key: string; metric_value: number | string }>) {
  const header = ['rollup_date', 'band_id', 'metric_key', 'metric_value']
  const lines = [header.join(',')]

  for (const row of rows) {
    lines.push([
      escapeCsvValue(row.rollup_date),
      escapeCsvValue(row.band_id ?? ''),
      escapeCsvValue(row.metric_key),
      escapeCsvValue(String(row.metric_value)),
    ].join(','))
  }

  return `${lines.join('\n')}\n`
}

export async function GET(request: NextRequest) {
  const adminAccess = await getRequestAdminAccess(request)

  if (!adminAccess) {
    return NextResponse.json({ message: 'Admin access required.' }, { status: 403 })
  }

  const serviceSupabase = createServiceClient()
  const { data, error } = await serviceSupabase
    .from('analytics_daily_rollups')
    .select('rollup_date, band_id, metric_key, metric_value')
    .order('rollup_date', { ascending: false })
    .order('band_id', { ascending: true })
    .order('metric_key', { ascending: true })

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }

  const csv = buildCsv((data ?? []) as Array<{ rollup_date: string; band_id: string | null; metric_key: string; metric_value: number | string }>)

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="stagesync-analytics-rollups.csv"',
      'cache-control': 'no-store',
    },
  })
}
