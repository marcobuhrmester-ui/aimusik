import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../lib/supabase-admin'

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const headerOk = request.headers.get('authorization') === `Bearer ${cronSecret}`
    const paramOk = request.nextUrl.searchParams.get('secret') === cronSecret
    if (!headerOk && !paramOk) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // Fetch songs without a preview that have a Deezer external_url
  const { data: songs, error: fetchError } = await supabaseAdmin
    .from('songs')
    .select('id, external_url')
    .is('preview_url', null)
    .like('external_url', '%deezer.com/track/%')
    .limit(10)

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  const rows = songs ?? []
  const stats = { checked: rows.length, updated: 0, skipped: 0, errors: [] as string[] }

  for (let i = 0; i < rows.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 300))

    const song = rows[i]
    // Extract numeric track ID from e.g. https://www.deezer.com/track/12345678
    const match = song.external_url?.match(/deezer\.com\/track\/(\d+)/)
    if (!match) { stats.skipped++; continue }
    const trackId = match[1]

    try {
      const res = await fetch(`https://api.deezer.com/track/${trackId}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error.message ?? 'Deezer error')

      const preview: string | null = json.preview || null
      if (!preview) { stats.skipped++; continue }

      const { error: updateError } = await supabaseAdmin
        .from('songs')
        .update({ preview_url: preview })
        .eq('id', song.id)

      if (updateError) throw new Error(updateError.message)
      stats.updated++
    } catch (err) {
      stats.errors.push(`song ${song.id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return NextResponse.json(stats)
}
