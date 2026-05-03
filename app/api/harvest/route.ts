import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../lib/supabase-admin'

// Search terms for Deezer track search
const TRACK_QUERIES = [
  'suno ai music',
  'udio ai generated',
  'ai generated music',
  'artificial intelligence music',
  'aiva music',
  'boomy ai',
  'soundraw music',
  'musicgen ai',
  'ki musik generiert',
]

// Playlist search terms — we fetch tracks from the found playlists
const PLAYLIST_QUERIES = [
  'ai generated music',
  'suno music',
  'udio playlist',
  'ki musik',
  'artificial intelligence songs',
]

interface DeezerTrack {
  id: number
  title: string
  artist: { name: string }
  link: string
}

function detectAITool(title: string, artist: string): string {
  const t = `${title} ${artist}`.toLowerCase()
  if (t.includes('suno')) return 'Suno'
  if (t.includes('udio')) return 'Udio'
  if (t.includes('aiva')) return 'AIVA'
  if (t.includes('boomy')) return 'Boomy'
  if (t.includes('soundraw')) return 'Soundraw'
  if (t.includes('stable audio')) return 'Stable Audio'
  if (t.includes('musicgen') || t.includes('music gen')) return 'MusicGen'
  if (t.includes('elevenlabs') || t.includes('eleven labs')) return 'ElevenLabs'
  return 'Andere'
}

async function deezerFetch(path: string): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.deezer.com${path}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (json.error) throw new Error(json.error.message ?? 'Deezer API error')
  return json
}

async function searchTracks(query: string): Promise<DeezerTrack[]> {
  try {
    const data = await deezerFetch(`/search?q=${encodeURIComponent(query)}&limit=50`)
    return (data.data as DeezerTrack[]) ?? []
  } catch {
    return []
  }
}

async function searchPlaylistIds(query: string): Promise<number[]> {
  try {
    const data = await deezerFetch(`/search/playlist?q=${encodeURIComponent(query)}&limit=5`)
    return ((data.data as { id: number }[]) ?? []).map((p) => p.id)
  } catch {
    return []
  }
}

async function getPlaylistTracks(id: number): Promise<DeezerTrack[]> {
  try {
    const data = await deezerFetch(`/playlist/${id}/tracks?limit=100`)
    return (data.data as DeezerTrack[]) ?? []
  } catch {
    return []
  }
}

export async function GET(request: NextRequest) {
  // Auth: Vercel Cron sends Authorization: Bearer <CRON_SECRET> automatically.
  // For manual testing, also accept ?secret=<CRON_SECRET>.
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const headerOk = request.headers.get('authorization') === `Bearer ${cronSecret}`
    const paramOk = request.nextUrl.searchParams.get('secret') === cronSecret
    if (!headerOk && !paramOk) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const stats = { fetched: 0, inserted: 0, skipped: 0, errors: [] as string[] }

  try {
    // 1. Direct track searches
    const trackResults = await Promise.all(TRACK_QUERIES.map(searchTracks))

    // 2. Playlist searches → fetch tracks from each found playlist
    const playlistIdResults = await Promise.all(PLAYLIST_QUERIES.map(searchPlaylistIds))
    const allPlaylistIds = [...new Set(playlistIdResults.flat())]
    const playlistTrackResults = await Promise.all(allPlaylistIds.map(getPlaylistTracks))

    // 3. Merge and deduplicate by Deezer track ID
    const allTracks = [...trackResults.flat(), ...playlistTrackResults.flat()]
    const unique = new Map<number, DeezerTrack>()
    for (const t of allTracks) {
      if (t?.id && t.title && t.artist?.name && t.link) {
        unique.set(t.id, t)
      }
    }
    stats.fetched = unique.size

    if (unique.size === 0) {
      return NextResponse.json({ ...stats, message: 'Keine Tracks gefunden' })
    }

    // 4. Check which external_urls already exist in DB
    const urls = [...unique.values()].map((t) => t.link)
    const { data: existing } = await supabaseAdmin
      .from('songs')
      .select('external_url')
      .in('external_url', urls)

    const existingSet = new Set((existing ?? []).map((r) => r.external_url))
    stats.skipped = existingSet.size

    const toInsert = [...unique.values()].filter((t) => !existingSet.has(t.link))

    if (toInsert.length === 0) {
      return NextResponse.json({ ...stats, message: 'Alle Tracks bereits vorhanden' })
    }

    // 5. Batch-insert in chunks of 50
    const rows = toInsert.map((t) => ({
      title: t.title,
      artist_name: t.artist.name,
      ai_tool: detectAITool(t.title, t.artist.name),
      external_url: t.link,
      score: 0,
      is_active: false,
    }))

    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50)
      const { error } = await supabaseAdmin.from('songs').insert(batch)
      if (error) {
        stats.errors.push(`Batch ${Math.floor(i / 50) + 1}: ${error.message}`)
      } else {
        stats.inserted += batch.length
      }
    }
  } catch (err) {
    stats.errors.push(err instanceof Error ? err.message : 'Unbekannter Fehler')
  }

  return NextResponse.json(stats)
}
