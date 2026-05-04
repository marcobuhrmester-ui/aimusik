import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../lib/supabase-admin'

// ─── Deezer ────────────────────────────────────────────────────────────────

const DEEZER_TRACK_QUERIES = [
  'suno ai',
  'udio music',
  'ai generated song',
  'ai music 2025',
  'ai music 2026',
  'artificial intelligence music',
  'suno generated',
  'udio generated',
  'ai vocal music',
  'ai pop song',
  'ai rock song',
  'ai hip hop ai',
  'ai electronic music',
  'ai country song',
  'ai jazz music',
  'ai blues song',
  'ai metal song',
  'ai folk music',
  'ai rnb song',
  'ai indie music',
  'ai dance music',
  'ai ambient music',
  'ai classical music',
  'ai reggae music',
  'ai soul music',
  'musicai generated',
  'ai singer',
  'ai band music',
  'ai composer',
  'ai produced music',
  'boomy ai music',
  'aiva music ai',
  'mubert ai music',
  'loudly ai music',
  'beatoven ai',
  'soundraw ai',
  'ai music generator',
  'neural music',
  'deepmind music',
  'machine learning music',
  'ai written song',
  'computer generated music',
  'algorithmically generated music',
  'synthetic music ai',
  'ai music artist',
  'ai pop artist',
  'ai rock artist',
  'ai music producer',
  'generative music ai',
  'ai music chart',
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
  'udio music',
  'ai generated song',
  'ai music 2025',
  'ai music 2026',
  'artificial intelligence music',
  'suno generated',
  'udio generated',
  'ai vocal music',
  'ai pop song',
  'ai rock song',
  'ai hip hop ai',
  'ai electronic music',
  'ai country song',
  'ai jazz music',
  'ai blues song',
  'ai metal song',
  'ai folk music',
  'ai rnb song',
  'ai indie music',
  'ai dance music',
  'ai ambient music',
  'ai classical music',
  'ai reggae music',
  'ai soul music',
  'musicai generated',
  'ai singer',
  'ai band music',
  'ai composer',
  'ai produced music',
  'boomy ai music',
  'aiva music ai',
  'mubert ai music',
  'loudly ai music',
  'beatoven ai',
  'soundraw ai',
  'ai music generator',
  'neural music',
  'deepmind music',
  'machine learning music',
  'ai written song',
  'computer generated music',
  'algorithmically generated music',
  'synthetic music ai',
  'ai music artist',
  'ai pop artist',
  'ai rock artist',
  'ai music producer',
  'generative music ai',
  'ai music chart',
]

const SPOTIFY_PLAYLIST_IDS = [
  '37i9dQZF1DX7rOY8MkBMFB',
  '37i9dQZF1DWXIcbzpLauPS',
  '7sOGAFTOgEfSiGFSNMwrOx',
  '6tlNnSqPBEJmBxlXJpYJdx',
  '2YRe7HZKkGGckSbm7rbHNm',
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
  console.log('[Spotify] Client ID gesetzt:', !!process.env.SPOTIFY_CLIENT_ID, '| Client Secret gesetzt:', !!process.env.SPOTIFY_CLIENT_SECRET)
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
  console.log('[Spotify] Token-Response: HTTP', res.status, '| Body:', rawBody)

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

async function spotifySearchTracks(query: string, token: string): Promise<SpotifyTrack[]> {
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=50`
  console.log('[Spotify] GET', url)
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`)
  }
  const json = await res.json()
  const count = (json.tracks?.items as unknown[])?.length ?? 0
  console.log(`[Spotify] Query "${query}": ${count} Tracks`)
  return json.tracks?.items ?? []
}

async function spotifyGetPlaylistTracks(playlistId: string, token: string): Promise<SpotifyTrack[]> {
  try {
    const urlString = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&fields=items(track(id,name,artists,external_urls))`
    const res = await fetch(urlString, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.log(`[Spotify] Playlist ${playlistId} Fehler: ${res.status} ${body.slice(0, 200)}`)
      return []
    }
    const json = await res.json()
    return ((json.items ?? []) as { track: SpotifyTrack | null }[])
      .map((item) => item.track)
      .filter((t): t is SpotifyTrack => t != null && !!t.id && !!t.name && !!t.artists?.length)
  } catch {
    return []
  }
}

// ─── YouTube ───────────────────────────────────────────────────────────────

const YOUTUBE_QUERIES = [
  'suno ai music',
  'udio ai song',
  'ai generated music 2025',
  'ai generated music 2026',
  'artificial intelligence music',
  'suno ai generated',
  'udio ai generated',
  'ai music video',
  'ai pop music',
  'ai rock music',
  'ai hip hop music',
  'ai electronic song',
  'ai country music',
  'ai jazz song',
  'ai blues music',
  'ai metal music',
  'ai folk song',
  'ai rnb music',
  'ai indie song',
  'ai dance song',
  'ai ambient song',
  'ai classical song',
  'ai reggae song',
  'ai soul song',
  'ai singer song',
  'boomy ai song',
  'aiva ai music',
  'mubert ai song',
  'soundraw ai music',
  'beatoven ai song',
  'ai music generator song',
  'neural network music',
  'machine learning song',
  'computer generated song',
  'algorithmically generated song',
  'synthetic ai music',
  'ai music artist song',
  'ai produced song',
  'generative ai music',
  'ai music 2025 new',
  'suno music new',
  'udio music new',
  'ai vocal song',
  'ai band song',
  'ai composer music',
  'ai written music',
  'deepmind music ai',
  'ai pop artist song',
  'ai rock artist song',
  'ai chart music',
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
  if (t.includes('mubert')) return 'Mubert'
  if (t.includes('beatoven')) return 'Beatoven'
  if (t.includes('loudly')) return 'Loudly'
  return 'Andere'
}

// ─── Shared DB helpers ─────────────────────────────────────────────────────

// Splits large ID lists into batches of 100 to avoid 414 URI Too Long from Supabase .in()
async function checkExistingIds(column: string, ids: string[], batchSize = 100): Promise<Set<string>> {
  const existing = new Set<string>()
  for (let i = 0; i < ids.length; i += batchSize) {
    const { data } = await supabaseAdmin
      .from('songs')
      .select(column)
      .in(column, ids.slice(i, i + batchSize))
    for (const row of data ?? []) {
      const val = (row as unknown as Record<string, unknown>)[column]
      if (val != null) existing.add(String(val))
    }
  }
  return existing
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
      const existingSet = await checkExistingIds('external_url', urls)
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

    // Search queries — allSettled so one failure doesn't suppress the rest
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

    // Playlist tracks
    const playlistResults = await Promise.all(
      SPOTIFY_PLAYLIST_IDS.map((id) => spotifyGetPlaylistTracks(id, token)),
    )
    allTracks.push(...playlistResults.flat())

    const unique = new Map<string, SpotifyTrack>()
    for (const t of allTracks) {
      if (t?.id && t.name && t.artists?.length) unique.set(t.id, t)
    }
    stats.spotify.fetched = unique.size

    if (unique.size > 0) {
      const spotifyIds = Array.from(unique.keys())
      const existingSet = await checkExistingIds('spotify_id', spotifyIds)
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
      const existingSet = await checkExistingIds('youtube_id', youtubeIds)
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
