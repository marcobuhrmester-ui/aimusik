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
    console.log('[Spotify] Token aus Cache, gültig bis', new Date(spotifyTokenCache.expiresAt).toISOString())
    return spotifyTokenCache.token
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  console.log('[Spotify] Token-Abruf: SPOTIFY_CLIENT_ID gesetzt:', !!clientId, '| SPOTIFY_CLIENT_SECRET gesetzt:', !!clientSecret)
  if (!clientId || !clientSecret) {
    throw new Error('SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET nicht gesetzt')
  }

  console.log('[Spotify] POST https://accounts.spotify.com/api/token')
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })

  const rawBody = await res.text()
  console.log('[Spotify] Token-Response: HTTP', res.status, '| Body:', rawBody.slice(0, 500))

  let json: Record<string, unknown> = {}
  try { json = JSON.parse(rawBody) } catch { /* non-JSON body */ }

  if (!res.ok || typeof json.access_token !== 'string' || !json.access_token) {
    spotifyTokenCache = null
    const detail = json.error_description ?? json.error ?? rawBody.slice(0, 200)
    throw new Error(`Spotify Auth HTTP ${res.status}: ${detail}`)
  }

  spotifyTokenCache = {
    token: json.access_token as string,
    expiresAt: Date.now() + ((json.expires_in as number) - 60) * 1000,
  }
  console.log('[Spotify] Token erfolgreich, expires_in:', json.expires_in)
  return spotifyTokenCache.token
}

// Throws on non-ok responses so the caller can surface the error
async function spotifySearchTracks(query: string, token: string): Promise<SpotifyTrack[]> {
  const url = new URL('https://api.spotify.com/v1/search')
  url.searchParams.set('q', query)
  url.searchParams.set('type', 'track')
  url.searchParams.set('limit', '50')
  const urlString = url.toString()
  console.log('[Spotify] GET', urlString)
  const res = await fetch(urlString, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.log('[Spotify] Fehler bei Query "' + query + '":', res.status, body.slice(0, 300))
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`)
  }
  const json = await res.json()
  const count = (json.tracks?.items as unknown[])?.length ?? 0
  console.log('[Spotify] Query "' + query + '": ' + count + ' Tracks')
  return (json.tracks?.items as SpotifyTrack[]) ?? []
}

// ─── YouTube ───────────────────────────────────────────────────────────────

const YOUTUBE_QUERIES = [
  'suno ai music',
  'udio ai generated song',
  'ai generated music 2025',
  'artificial intelligence music',
]

interface YouTubeVideo {
  id: string
  title: string
  channelTitle: string
  coverUrl: string
}

async function youtubeSearchVideos(query: string, apiKey: string): Promise<YouTubeVideo[]> {
  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search')
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('q', query)
    url.searchParams.set('type', 'video')
    url.searchParams.set('maxResults', '50')
    url.searchParams.set('key', apiKey)

    const res = await fetch(url.toString(), { cache: 'no-store' })
    if (!res.ok) return []
    const json = await res.json()

    return ((json.items ?? []) as Record<string, unknown>[])
      .filter((item) => {
        const id = item.id as Record<string, unknown>
        return typeof id?.videoId === 'string'
      })
      .map((item) => {
        const id = item.id as Record<string, string>
        const snippet = item.snippet as Record<string, unknown>
        const thumbnails = (snippet.thumbnails ?? {}) as Record<string, { url: string }>
        const coverUrl =
          thumbnails.high?.url ?? thumbnails.medium?.url ?? thumbnails.default?.url ?? ''
        return {
          id: id.videoId,
          title: (snippet.title as string) ?? '',
          channelTitle: (snippet.channelTitle as string) ?? '',
          coverUrl,
        }
      })
      .filter((v) => v.id && v.title)
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
    youtube: { fetched: 0, inserted: 0, skipped: 0 },
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

    // allSettled so a single failing query doesn't suppress the rest
    const searchResults = await Promise.allSettled(
      SPOTIFY_QUERIES.map((q) => spotifySearchTracks(q, token)),
    )

    const allTracks: SpotifyTrack[] = []
    for (let i = 0; i < searchResults.length; i++) {
      const r = searchResults[i]
      if (r.status === 'fulfilled') {
        allTracks.push(...r.value)
      } else {
        stats.errors.push(
          `Spotify[${SPOTIFY_QUERIES[i]}]: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`,
        )
      }
    }

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

  // ── YouTube ─────────────────────────────────────────────────────────────

  try {
    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) throw new Error('YOUTUBE_API_KEY nicht gesetzt')

    const searchResults = await Promise.all(YOUTUBE_QUERIES.map((q) => youtubeSearchVideos(q, apiKey)))
    const allVideos = searchResults.flat()

    const unique = new Map<string, YouTubeVideo>()
    for (const v of allVideos) {
      if (!unique.has(v.id)) unique.set(v.id, v)
    }
    stats.youtube.fetched = unique.size

    if (unique.size > 0) {
      const youtubeIds = Array.from(unique.keys())
      const { data: existing } = await supabaseAdmin
        .from('songs')
        .select('youtube_id')
        .in('youtube_id', youtubeIds)

      const existingSet = new Set((existing ?? []).map((r) => r.youtube_id))
      stats.youtube.skipped = existingSet.size

      const toInsert = Array.from(unique.values())
        .filter((v) => !existingSet.has(v.id))
        .map((v) => ({
          title: v.title,
          artist_name: v.channelTitle,
          ai_tool: detectAITool(v.title, v.channelTitle),
          external_url: `https://www.youtube.com/watch?v=${v.id}`,
          youtube_id: v.id,
          cover_url: v.coverUrl || null,
          score: 0,
          is_active: true,
        }))

      for (let i = 0; i < toInsert.length; i += 50) {
        const batch = toInsert.slice(i, i + 50)
        const { error } = await supabaseAdmin.from('songs').insert(batch)
        if (error) stats.errors.push(`YouTube batch ${Math.floor(i / 50) + 1}: ${error.message}`)
        else stats.youtube.inserted += batch.length
      }
    }
  } catch (err) {
    stats.errors.push(`YouTube: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`)
  }

  return NextResponse.json(stats)
}
