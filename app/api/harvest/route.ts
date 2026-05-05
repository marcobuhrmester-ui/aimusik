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
  album: { id: number }
  link: string
  rank: number
  preview?: string
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

// Deezer genre names → our canonical names. Empty string = fall back to detectGenre.
const DEEZER_GENRE_MAP: Record<string, string> = {
  electro: 'Electronic', electronic: 'Electronic', dance: 'Electronic',
  house: 'Electronic', techno: 'Electronic', edm: 'Electronic',
  'hip hop': 'Hip-Hop', 'hip-hop': 'Hip-Hop', rap: 'Hip-Hop',
  'r&b': 'R&B', soul: 'R&B',
  pop: 'Pop', rock: 'Rock', metal: 'Metal', jazz: 'Jazz',
  blues: 'Blues', classical: 'Classical', folk: 'Folk', country: 'Country',
  ambient: 'Lo-Fi', chill: 'Lo-Fi',
  indie: 'Rock', alternative: 'Rock',
}

function normalizeDeezerGenre(name: string): string {
  const lower = name.toLowerCase()
  for (const [key, val] of Object.entries(DEEZER_GENRE_MAP)) {
    if (lower.includes(key)) return val
  }
  return ''
}

async function deezerGetAlbumGenre(albumId: number): Promise<string> {
  try {
    const data = await deezerFetch(`/album/${albumId}`)
    const genres = (data.genres as { data: { name: string }[] } | undefined)?.data ?? []
    return normalizeDeezerGenre(genres[0]?.name ?? '')
  } catch {
    return ''
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
  popularity?: number
  preview_url?: string | null
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
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`
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

// YouTube category IDs → genre. categoryId is not in search results;
// we fetch it separately via /videos?part=snippet.
const YOUTUBE_CATEGORY_GENRE: Record<string, string> = {
  '10': 'Pop',        // Music (generic)
  '24': 'Electronic', // Entertainment (often DJ/electronic content)
  '1':  'Pop',        // Film & Animation
  '2':  'Pop',        // Autos & Vehicles
  '22': 'Pop',        // People & Blogs
  '23': 'Pop',        // Comedy
  '25': 'Pop',        // News & Politics
  '26': 'Pop',        // Howto & Style
  '28': 'Pop',        // Science & Technology
}

async function youtubeGetCategoryIds(
  videoIds: string[],
  apiKey: string,
): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  for (let i = 0; i < videoIds.length; i += 50) {
    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/videos')
      url.searchParams.set('part', 'snippet')
      url.searchParams.set('id', videoIds.slice(i, i + 50).join(','))
      url.searchParams.set('key', apiKey)
      const res = await fetch(url.toString(), { cache: 'no-store' })
      if (!res.ok) continue
      const json = await res.json()
      for (const item of (json.items ?? []) as { id: string; snippet: { categoryId: string } }[]) {
        result.set(item.id, item.snippet?.categoryId ?? '')
      }
    } catch {
      // non-fatal: fall back to detectGenre for this batch
    }
  }
  return result
}

function cleanDeezerArtistName(raw: string): string {
  // Some Deezer tracks embed full metadata in the artist name field.
  // Try to extract the real artist from "Artista: <name> <next-keyword>..." patterns.
  if (/T[ií]tulo:|Artista:|Autor|Produtor/i.test(raw)) {
    const m = raw.match(/Artista:\s*([^:\n]+?)(?:\s{2,}|\s+(?:Autor|Produtor|T[ií]tulo|G[eé]nero|Album|Label|℗|©)|$)/i)
    if (m) return m[1].trim().slice(0, 80)
    // Fallback: first "word group" before a colon-bearing section
    const first = raw.split(/\s{2,}|\s+(?=\w+:)/)[0]
    if (first && first.length < 80) return first.trim()
  }
  // Truncate names that are unreasonably long
  if (raw.length > 80) return raw.slice(0, 80).trimEnd()
  return raw
}

// ─── Shared helpers ────────────────────────────────────────────────────────

const AI_ARTIST_KEYWORDS = [
  'suno', 'udio', 'suno ai', 'udio ai', 'ai artist', 'ai band', 'ai singer',
  'ai composer', 'ai music', 'aimusic', 'bot', 'neural', 'generated',
  'synthetic', 'mubert', 'boomy', 'aiva', 'beatoven', 'soundraw', 'mureka',
  'musicgen', 'loudly', 'beatbot', 'aiband', 'aiartist', 'artificialintelligence',
  'riffusion', 'stable audio', 'musiclm', 'bark ai', 'voicebox',
]
const AI_TITLE_KEYWORDS = [
  'suno', 'udio', 'ai generated', 'ai music', 'neural', 'synthetic music',
  'ai song', 'ai track', 'ai composed', 'ai produced', 'made by ai',
]

const KNOWN_HUMAN_ARTISTS = [
  'deadmau5', 'r2bees', 'jean sant', 'tiziana massaro', 'orchestra del maggio',
]

function isLikelyAIGenerated(title: string, artist: string): boolean {
  const a = artist.toLowerCase()
  const t = title.toLowerCase()

  // Known human artists — block before any other check
  if (KNOWN_HUMAN_ARTISTS.some((name) => a.includes(name))) return false

  // Artist name contains an AI tool/keyword
  if (AI_ARTIST_KEYWORDS.some((kw) => a.includes(kw))) return true

  // Title contains an AI-specific phrase
  if (AI_TITLE_KEYWORDS.some((kw) => t.includes(kw))) return true

  return false
}

function detectGenre(title: string, artist: string): string {
  const t = `${title} ${artist}`.toLowerCase()
  if (t.includes('hip hop') || t.includes('hiphop') || t.includes('rap')) return 'Hip-Hop'
  if (t.includes('r&b') || t.includes('rnb') || t.includes('soul')) return 'R&B'
  if (t.includes('electronic') || t.includes('electro') || t.includes('techno') || t.includes('house') || t.includes('edm')) return 'Electronic'
  if (t.includes('ambient') || t.includes('chill') || t.includes('lo-fi') || t.includes('lofi')) return 'Lo-Fi'
  if (t.includes('classical') || t.includes('orchestra') || t.includes('piano')) return 'Classical'
  if (t.includes('metal')) return 'Metal'
  if (t.includes('jazz')) return 'Jazz'
  if (t.includes('blues')) return 'Blues'
  if (t.includes('country')) return 'Country'
  if (t.includes('folk')) return 'Folk'
  if (t.includes('rock')) return 'Rock'
  if (t.includes('pop')) return 'Pop'
  return 'Pop'
}

function detectAITool(title: string, artist: string): string {
  const ttl = title.toLowerCase()
  const art = artist.toLowerCase()

  // 1. Title keywords (highest confidence — user-supplied tags in the title)
  if (ttl.includes('(ai suno)') || ttl.includes('[suno]') || ttl.includes('suno')) return 'Suno'
  if (ttl.includes('(ai udio)') || ttl.includes('[udio]') || ttl.includes('udio')) return 'Udio'
  if (ttl.includes('boomy')) return 'Boomy'
  if (ttl.includes('aiva')) return 'AIVA'
  if (ttl.includes('soundraw')) return 'Soundraw'
  if (ttl.includes('beatoven')) return 'Beatoven'
  if (ttl.includes('mubert')) return 'Mubert'
  if (ttl.includes('musicgen') || ttl.includes('music gen')) return 'MusicGen'
  if (ttl.includes('loudly')) return 'Loudly'
  if (ttl.includes('riffusion')) return 'Riffusion'
  if (ttl.includes('stable audio')) return 'Stable Audio'
  if (ttl.includes('musiclm')) return 'MusicLM'
  if (ttl.includes('bark ai') || ttl.includes('bark-ai')) return 'Bark'
  if (ttl.includes('elevenlabs') || ttl.includes('eleven labs')) return 'ElevenLabs'

  // 2. Artist keywords
  if (art.includes('audiomachine')) return 'Udio'
  if (art.includes('suno')) return 'Suno'
  if (art.includes('udio')) return 'Udio'
  if (art.includes('aiva')) return 'AIVA'
  if (art.includes('boomy')) return 'Boomy'
  if (art.includes('soundraw')) return 'Soundraw'
  if (art.includes('stable audio')) return 'Stable Audio'
  if (art.includes('musicgen') || art.includes('music gen')) return 'MusicGen'
  if (art.includes('elevenlabs') || art.includes('eleven labs')) return 'ElevenLabs'
  if (art.includes('mubert')) return 'Mubert'
  if (art.includes('beatoven')) return 'Beatoven'
  if (art.includes('loudly')) return 'Loudly'
  if (art.includes('riffusion')) return 'Riffusion'
  if (art.includes('musiclm')) return 'MusicLM'
  if (art.includes('bark ai') || art.includes('bark-ai')) return 'Bark'
  if (art.includes('ai band') || art.includes('ai artist') || art.includes('ai singer')) return 'Andere KI'

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

      const newTracks = uniqueValues
        .filter((t) => !existingSet.has(t.link))
        .filter((t) => isLikelyAIGenerated(t.title, t.artist.name))

      // Fetch album genres for new tracks only (parallel, unique album IDs)
      const uniqueAlbumIds = Array.from(new Set(newTracks.map((t) => t.album?.id).filter(Boolean) as number[]))
      const albumGenreResults = await Promise.all(uniqueAlbumIds.map(deezerGetAlbumGenre))
      const albumGenreMap = new Map<number, string>()
      uniqueAlbumIds.forEach((id, i) => { if (albumGenreResults[i]) albumGenreMap.set(id, albumGenreResults[i]) })

      // Log rank of first new track so we can verify the field arrives from the API
      if (newTracks.length > 0) {
        const s = newTracks[0]
        console.log(`[Deezer] Sample rank: id=${s.id} title="${s.title}" artist="${s.artist.name}" rank=${s.rank} → score=${Math.max(1, Math.round((s.rank ?? 0) / 1000))}`)
      }

      const toInsert = newTracks
        .map((t) => {
          const artistName = cleanDeezerArtistName(t.artist.name)
          return {
            title: t.title,
            artist_name: artistName,
            ai_tool: detectAITool(t.title, artistName),
            genre: albumGenreMap.get(t.album?.id) || detectGenre(t.title, artistName),
            external_url: t.link,
            preview_url: t.preview || null,
            score: Math.max(1, Math.round((t.rank ?? 0) / 1000)),
            is_active: true,
          }
        })

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
        .filter((t) => isLikelyAIGenerated(t.name, t.artists.map((a: { name: string }) => a.name).join(' ')))
        .map((t) => ({
          title: t.name,
          artist_name: t.artists.map((a: { name: string }) => a.name).join(', '),
          ai_tool: detectAITool(t.name, t.artists.map((a: { name: string }) => a.name).join(' ')),
          genre: detectGenre(t.name, t.artists.map((a: { name: string }) => a.name).join(' ')),
          external_url: t.external_urls.spotify,
          spotify_id: t.id,
          preview_url: t.preview_url || null,
          score: Math.max(1, t.popularity ?? 1),
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

      const newVideos = Array.from(unique.values())
        .filter((v) => !existingSet.has(v.id))
        .filter((v) => isLikelyAIGenerated(v.title, v.channelTitle))

      // Fetch categoryIds for new videos only (batched, 50 IDs per request)
      const categoryMap = await youtubeGetCategoryIds(newVideos.map((v) => v.id), apiKey)

      const toInsert = newVideos
        .map((v) => {
          const catId = categoryMap.get(v.id) ?? ''
          const genre = YOUTUBE_CATEGORY_GENRE[catId] ?? detectGenre(v.title, v.channelTitle)
          return {
            title: v.title,
            artist_name: v.channelTitle,
            ai_tool: detectAITool(v.title, v.channelTitle),
            genre,
            external_url: `https://www.youtube.com/watch?v=${v.id}`,
            youtube_id: v.id,
            cover_url: v.coverUrl || null,
            score: 1,
            is_active: true,
          }
        })

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

  // ── Recalculate scores ───────────────────────────────────────────────────
  const { error: rpcError } = await supabaseAdmin.rpc('calculate_scores')
  if (rpcError) stats.errors.push(`calculate_scores: ${rpcError.message}`)

  return NextResponse.json(stats)
}
