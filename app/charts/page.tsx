import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default async function ChartsPage({
  searchParams,
}: {
  searchParams: { genre?: string }
}) {
  noStore()

  const activeGenre = searchParams.genre ?? null

  // Genre pills — distinct genres with counts
  const { data: genreRows } = await supabase
    .from('songs')
    .select('genre')
    .not('genre', 'is', null)
    .eq('is_active', true)

  const genreCounts: Record<string, number> = {}
  for (const row of genreRows ?? []) {
    if (row.genre) genreCounts[row.genre] = (genreCounts[row.genre] ?? 0) + 1
  }
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([g]) => g)

  // Songs — filtered by genre if active
  let songsQuery = supabase
    .from('songs')
    .select('*')
    .order('score', { ascending: false })
    .limit(50)

  if (activeGenre) {
    songsQuery = songsQuery.eq('genre', activeGenre)
  }

  const { data: songs } = await songsQuery

  const songIds = songs?.map((s) => s.id) ?? []

  const { data: history } = songIds.length > 0
    ? await supabase
        .from('chart_history')
        .select('song_id, position, created_at')
        .in('song_id', songIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const lastPosition: Record<number, number> = {}
  if (history) {
    for (const row of history) {
      if (!(row.song_id in lastPosition)) {
        lastPosition[row.song_id] = row.position
      }
    }
  }

  const maxScore = songs && songs.length > 0 ? Math.max(...songs.map((s) => s.score)) : 100

  function getTrend(songId: number, currentRank: number) {
    if (!(songId in lastPosition)) return { label: 'NEW', color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' }
    const last = lastPosition[songId]
    if (last > currentRank) return { label: 'UP', color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' }
    if (last < currentRank) return { label: 'DOWN', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' }
    return { label: 'STABLE', color: '#555', bg: 'rgba(85,85,85,0.08)', border: 'rgba(85,85,85,0.2)' }
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
        .nav-link { color: #555; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        .nav-link:hover { color: #ff6a00; }
        .nav-link.active { color: #ff6a00; }
        .chart-row { display: grid; grid-template-columns: 52px 72px 1fr 140px 130px; align-items: center; gap: 16px; padding: 14px 20px; background: transparent; border-radius: 8px; cursor: pointer; transition: background 0.15s; text-decoration: none; color: inherit; }
        .chart-row:hover { background: #131313; }
        .submit-btn { background: linear-gradient(90deg, #ff4500, #ff8c00); color: white; border: none; padding: 8px 18px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: none; transition: opacity 0.2s, transform 0.1s; display: inline-block; }
        .submit-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        .genre-pill { display: inline-block; padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; text-decoration: none; border: 1px solid #222; transition: border-color 0.15s, background 0.15s, color 0.15s; white-space: nowrap; text-transform: capitalize; }
        .genre-pill:hover { border-color: #ff6a00; color: #ff8c00; }
        .genre-pill.active { background: linear-gradient(90deg, #ff4500, #ff8c00); border-color: transparent; color: #fff; }
        .genre-pill.inactive { background: #0d0d0d; color: #555; }
      `}</style>

      <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

        <header style={{ borderBottom: '1px solid #161616', position: 'sticky', top: 0, backgroundColor: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)', zIndex: 100 }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
                <defs>
                  <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff4500" /><stop offset="100%" stopColor="#ff8c00" />
                  </linearGradient>
                </defs>
                <rect x="2"  y="14" width="4" height="6"  rx="2" fill="url(#logoGrad)" />
                <rect x="8"  y="9"  width="4" height="16" rx="2" fill="url(#logoGrad)" />
                <rect x="14" y="3"  width="4" height="28" rx="2" fill="url(#logoGrad)" />
                <rect x="20" y="7"  width="4" height="20" rx="2" fill="url(#logoGrad)" />
                <rect x="26" y="12" width="4" height="10" rx="2" fill="url(#logoGrad)" />
              </svg>
              <span style={{ fontSize: '19px', fontWeight: '700', background: 'linear-gradient(90deg, #ff4500, #ff8c00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.3px' }}>
                aimusik.eu
              </span>
            </Link>
            <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
              <Link href="/charts" className="nav-link active">Charts</Link>
              <Link href="/genre" className="nav-link">Genres</Link>
              <a href="#" className="nav-link">Tools</a>
              <a href="#" className="nav-link">Blog</a>
              <Link href="/submit" className="submit-btn">Submit Song</Link>
            </nav>
          </div>
        </header>

        <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '52px 24px 80px' }}>

          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px' }}>
              <div style={{ width: '4px', height: '30px', background: 'linear-gradient(180deg, #ff4500, #ff8c00)', borderRadius: '2px', flexShrink: 0 }} />
              <h1 style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px' }}>
                {activeGenre ? (
                  <span style={{ textTransform: 'capitalize' }}>{activeGenre} Charts</span>
                ) : 'Top 50 Charts'}
              </h1>
            </div>
            <p style={{ color: '#444', fontSize: '13px', paddingLeft: '18px' }}>
              Die meistbewerteten KI-generierten Songs — kuratiert von der Community
            </p>
          </div>

          {/* Genre filter pills */}
          {topGenres.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
              <Link
                href="/charts"
                className={`genre-pill ${!activeGenre ? 'active' : 'inactive'}`}
              >
                Alle
              </Link>
              {topGenres.map((genre) => (
                <Link
                  key={genre}
                  href={`/charts?genre=${encodeURIComponent(genre)}`}
                  className={`genre-pill ${activeGenre === genre ? 'active' : 'inactive'}`}
                >
                  {genre}
                </Link>
              ))}
            </div>
          )}

          {songs && songs.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '52px 72px 1fr 140px 130px', gap: '16px', padding: '0 20px 10px', borderBottom: '1px solid #161616', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: '#333', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', textAlign: 'center' }}>#</span>
              <span style={{ fontSize: '11px', color: '#333', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', textAlign: 'center' }}>Trend</span>
              <span style={{ fontSize: '11px', color: '#333', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Song</span>
              <span style={{ fontSize: '11px', color: '#333', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', textAlign: 'center' }}>AI Tool</span>
              <span style={{ fontSize: '11px', color: '#333', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', textAlign: 'right' }}>Score</span>
            </div>
          )}

          {songs && songs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {songs.map((song, index) => {
                const rank = index + 1
                const trend = getTrend(song.id, rank)
                return (
                  <Link key={song.id} href={`/charts/${song.id}`} className="chart-row">

                    <div style={{ textAlign: 'center' }}>
                      {index < 3 ? (
                        <span style={{ fontSize: '15px', fontWeight: '800', background: 'linear-gradient(135deg, #ff4500, #ff8c00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                          {rank}
                        </span>
                      ) : (
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{rank}</span>
                      )}
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: '700',
                        letterSpacing: '0.5px',
                        color: trend.color,
                        background: trend.bg,
                        border: `1px solid ${trend.border}`,
                      }}>
                        {trend.label}
                      </span>
                    </div>

                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ fontWeight: '600', fontSize: '15px', color: '#f0f0f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {song.title}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '3px' }}>
                        <p style={{ fontSize: '13px', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                          {song.artist_name}
                        </p>
                        {song.genre && (
                          <span style={{ flexShrink: 0, display: 'inline-block', padding: '2px 7px', borderRadius: '10px', fontSize: '10px', fontWeight: '600', background: '#161616', color: '#666', border: '1px solid #222', letterSpacing: '0.2px', whiteSpace: 'nowrap' }}>
                            {song.genre}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: '#111', color: '#ff8c00', border: '1px solid #222', letterSpacing: '0.2px', whiteSpace: 'nowrap' }}>
                        {song.ai_tool}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#ff7a20' }}>
                        {song.score.toLocaleString()} pts
                      </span>
                      <div style={{ width: '100px', height: '3px', background: '#1c1c1c', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.round((song.score / maxScore) * 100)}%`,
                          background: 'linear-gradient(90deg, #ff4500, #ff8c00)',
                          borderRadius: '2px',
                        }} />
                      </div>
                    </div>

                  </Link>
                )
              })}
            </div>
          ) : (
            <div style={{ marginTop: '24px', padding: '72px 32px', textAlign: 'center', border: '1px solid #161616', borderRadius: '12px', background: '#0d0d0d' }}>
              <p style={{ color: '#444', fontSize: '16px', marginBottom: '8px', fontWeight: '500' }}>
                {activeGenre ? `Keine Songs im Genre "${activeGenre}" gefunden` : 'Noch keine Songs in der Datenbank'}
              </p>
              <p style={{ color: '#2a2a2a', fontSize: '13px' }}>
                {activeGenre && (
                  <Link href="/charts" style={{ color: '#ff6a00', textDecoration: 'none' }}>← Alle Charts anzeigen</Link>
                )}
              </p>
            </div>
          )}
        </main>

        <footer style={{ borderTop: '1px solid #111', padding: '24px', textAlign: 'center' }}>
          <p style={{ color: '#2a2a2a', fontSize: '12px' }}>© 2026 aimusik.eu · Europas KI-Musik-Chart-Plattform</p>
        </footer>
      </div>
    </>
  )
}
