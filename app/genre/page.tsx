import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

const GENRE_EMOJI: Record<string, string> = {
  pop: '🎵',
  rock: '🎸',
  electronic: '🎛️',
  'hip hop': '🎤',
  hiphop: '🎤',
  jazz: '🎷',
  classical: '🎼',
  metal: '🤘',
  folk: '🪕',
  country: '🤠',
  rnb: '🎙️',
  'r&b': '🎙️',
  blues: '🎺',
  ambient: '🌌',
  dance: '💃',
  indie: '🎶',
  reggae: '🌴',
  soul: '❤️',
  vocal: '🎤',
}

function getEmoji(genre: string) {
  return GENRE_EMOJI[genre.toLowerCase()] ?? '🎵'
}

export const metadata = {
  title: 'Genres · aimusik.eu',
  description: 'Alle KI-Musik-Genres auf einen Blick',
}

export default async function GenrePage() {
  noStore()

  const { data: rows } = await supabase
    .from('songs')
    .select('genre')
    .not('genre', 'is', null)
    .eq('is_active', true)

  const counts: Record<string, number> = {}
  for (const row of rows ?? []) {
    if (row.genre) counts[row.genre] = (counts[row.genre] ?? 0) + 1
  }

  const genres = Object.entries(counts).sort((a, b) => b[1] - a[1])

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
        .nav-link { color: #555; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        .nav-link:hover { color: #ff6a00; }
        .nav-link.active { color: #ff6a00; }
        .submit-btn { background: linear-gradient(90deg, #ff4500, #ff8c00); color: white; border: none; padding: 8px 18px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: none; transition: opacity 0.2s, transform 0.1s; display: inline-block; }
        .submit-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        .genre-card { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 28px 16px; background: #0d0d0d; border: 1px solid #161616; border-radius: 12px; text-decoration: none; color: inherit; transition: border-color 0.18s, background 0.18s, transform 0.15s; }
        .genre-card:hover { border-color: #ff6a00; background: #111; transform: translateY(-2px); }
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
              <Link href="/charts" className="nav-link">Charts</Link>
              <Link href="/genre" className="nav-link active">Genres</Link>
              <a href="#" className="nav-link">Tools</a>
              <a href="#" className="nav-link">Blog</a>
              <Link href="/submit" className="submit-btn">Submit Song</Link>
            </nav>
          </div>
        </header>

        <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '52px 24px 80px' }}>

          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px' }}>
              <div style={{ width: '4px', height: '30px', background: 'linear-gradient(180deg, #ff4500, #ff8c00)', borderRadius: '2px', flexShrink: 0 }} />
              <h1 style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px' }}>Genres</h1>
            </div>
            <p style={{ color: '#444', fontSize: '13px', paddingLeft: '18px' }}>
              KI-generierte Musik nach Genre entdecken
            </p>
          </div>

          {genres.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {genres.map(([genre, count]) => (
                <Link key={genre} href={`/genre/${encodeURIComponent(genre)}`} className="genre-card">
                  <span style={{ fontSize: '32px', lineHeight: 1 }}>{getEmoji(genre)}</span>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#e0e0e0', textTransform: 'capitalize', textAlign: 'center' }}>
                    {genre}
                  </span>
                  <span style={{ fontSize: '12px', color: '#444', fontWeight: '500' }}>
                    {count} {count === 1 ? 'Song' : 'Songs'}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ padding: '72px 32px', textAlign: 'center', border: '1px solid #161616', borderRadius: '12px', background: '#0d0d0d' }}>
              <p style={{ color: '#444', fontSize: '16px', marginBottom: '8px', fontWeight: '500' }}>
                Noch keine Genres in der Datenbank
              </p>
              <p style={{ color: '#2a2a2a', fontSize: '13px' }}>
                Genres erscheinen hier, sobald Songs klassifiziert werden
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
