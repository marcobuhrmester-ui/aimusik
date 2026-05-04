import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../lib/supabase-admin'

// ─── Deezer ────────────────────────────────────────────────────────────────

const DEEZER_TRACK_QUERIES = [
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

const DEEZER_PLAYLIST_QUERIES = [
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

async function deezerFetch(path: string): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.deezer.com${path}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (json.error) throw new Error(json.error.message ?? 'Deezer API error')
  return json
}

async function deezerSearchTracks(query: string): Promise<DeezerTrack[]> {
  try {
    const data = await deezerFetch(`/search?q=${encodeURIComponent(query)}&limit=50`)
    return (data.data as DeezerTrack[]) ?? []
  } catch {
    return []
  }
}

async function deezerSearchPlaylistIds(query: string): Promise<number[]> {
  try {
    const data = await deezerFetch(`/search/playlist?q=${encodeURIComponent(query)}&limit=5`)
    return ((data.data as { id: number }[]) ?? []).map((p) => p.id)
  } catch {
    return []
  }
}

async function deezerGetPlaylistTracks(id: number): Promise<DeezerTrack[]> {
  try {
    const data = await deezerFetch(`/playlist/${id}/tracks?limit=100`)
    return (data.data as DeezerTrack[]) ?? []
  } catch {
    return []
  }
}

// ─── Spotify ───────────────────────────────────────────────────────────────

const SPOTIFY_QUERIES = [
  'suno ai',
  'udio ai generated',
  'ai music 2025',
  'artificial intelligence music',
  'ai generated music',
]

interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
  external_urls: { spotify: string }
}

let spotifyTokenCache: { token: string; expiresAt: number } | null = null

async function getSpotifyToken(): Promise<string> {
  if (spotifyTokenCache && Date.now() < spotifyTokenCache.expiresAt) {
    return spotifyTokenCache.token
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET nicht gesetzt')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`Spotify auth HTTP ${res.status}`)
  const json = await res.json()
  spotifyTokenCache = { token: json.access_token, expiresAt: Date.now() + (json.expires_in - 60) * 1000 }
  return spotifyTokenCache.token
}

async function spotifySearchTracks(query: string, token: string): Promise<SpotifyTrack[]> {
  try {
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=50`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.tracks?.items as SpotifyTrack[]) ?? []
  } catch {
    return []
  }
}

// ─── Shared helpers ────────────────────────────────────────────────────────

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

// ─── Route handler ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const headerOk = request.headers.get('authorization') === `Bearer ${cronSecret}`
    const paramOk = request.nextUrl.searchParams.get('secret') === cronSecret
    if (!headerOk && !paramOk) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const stats = {
    deezer: { fetched: 0, inserted: 0, skipped: 0 },
    spotify: { fetched: 0, inserted: 0, skipped: 0 },
    errors: [] as string[],
  }

  // ── Deezer ──────────────────────────────────────────────────────────────

  try {
    const trackResults = await Promise.all(DEEZER_TRACK_QUERIES.map(deezerSearchTracks))
    const playlistIdResults = await Promise.all(DEEZER_PLAYLIST_QUERIES.map(deezerSearchPlaylistIds))
    const allPlaylistIds = Array.from(new Set(playlistIdResults.flat()))
    const playlistTrackResults = await Promise.all(allPlaylistIds.map(deezerGetPlaylistTracks))

    const allTracks = [...trackResults.flat(), ...playlistTrackResults.flat()]
    const unique = new Map<number, DeezerTrack>()
    for (const t of allTracks) {
      if (t?.id && t.title && t.artist?.name && t.link) unique.set(t.id, t)
    }
    stats.deezer.fetched = unique.size

    if (unique.size > 0) {
      const uniqueValues = Array.from(unique.values())
      const urls = uniqueValues.map((t) => t.link)
      const { data: existing } = await supabaseAdmin
        .from('songs')
        .select('external_url')
        .in('external_url', urls)

      const existingSet = new Set((existing ?? []).map((r) => r.external_url))
      stats.deezer.skipped = existingSet.size

      const toInsert = uniqueValues
        .filter((t) => !existingSet.has(t.link))
        .map((t) => ({
          title: t.title,
          artist_name: t.artist.name,
          ai_tool: detectAITool(t.title, t.artist.name),
          external_url: t.link,
          score: 0,
          is_active: true,
        }))

      for (let i = 0; i < toInsert.length; i += 50) {
        const batch = toInsert.slice(i, i + 50)
        const { error } = await supabaseAdmin.from('songs').insert(batch)
        if (error) stats.errors.push(`Deezer batch ${Math.floor(i / 50) + 1}: ${error.message}`)
        else stats.deezer.inserted += batch.length
      }
    }
  } catch (err) {
    stats.errors.push(`Deezer: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`)
  }

  // ── Spotify ─────────────────────────────────────────────────────────────

  try {
    const token = await getSpotifyToken()

    const searchResults = await Promise.all(SPOTIFY_QUERIES.map((q) => spotifySearchTracks(q, token)))
    const allTracks = searchResults.flat()

    const unique = new Map<string, SpotifyTrack>()
    for (const t of allTracks) {
      if (t?.id && t.name && t.artists?.length) unique.set(t.id, t)
    }
    stats.spotify.fetched = unique.size

    if (unique.size > 0) {
      const spotifyIds = Array.from(unique.keys())
      const { data: existing } = await supabaseAdmin
        .from('songs')
        .select('spotify_id')
        .in('spotify_id', spotifyIds)

      const existingSet = new Set((existing ?? []).map((r) => r.spotify_id))
      stats.spotify.skipped = existingSet.size

      const toInsert = Array.from(unique.values())
        .filter((t) => !existingSet.has(t.id))
        .map((t) => ({
          title: t.name,
          artist_name: t.artists.map((a: { name: string }) => a.name).join(', '),
          ai_tool: detectAITool(t.name, t.artists.map((a: { name: string }) => a.name).join(' ')),
          external_url: t.external_urls.spotify,
          spotify_id: t.id,
          score: 0,
          is_active: true,
        }))

      for (let i = 0; i < toInsert.length; i += 50) {
        const batch = toInsert.slice(i, i + 50)
        const { error } = await supabaseAdmin.from('songs').insert(batch)
        if (error) stats.errors.push(`Spotify batch ${Math.floor(i / 50) + 1}: ${error.message}`)
        else stats.spotify.inserted += batch.length
      }
    }
  } catch (err) {
    stats.errors.push(`Spotify: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`)
  }

  return NextResponse.json(stats)
}
