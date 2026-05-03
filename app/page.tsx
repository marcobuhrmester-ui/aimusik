import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { supabase } from './lib/supabase'

export default async function Home() {
  noStore()

  const { data: songs } = await supabase
    .from('songs')
    .select('*')
    .order('score', { ascending: false })
    .limit(10)

  const maxScore = songs && songs.length > 0 ? Math.max(...songs.map((s) => s.score)) : 100

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
        .nav-link { color: #555; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        .nav-link:hover { color: #ff6a00; }
        .nav-link.active { color: #ff6a00; }
        .chart-row { display: grid; grid-template-columns: 48px 1fr 140px 120px; align-items: center; gap: 16px; padding: 14px 20px; background: transparent; border-radius: 8px; cursor: pointer; transition: background 0.15s; text-decoration: none; color: inherit; }
        .chart-row:hover { background: #131313; }
        .submit-btn {
          background: linear-gradient(90deg, #ff4500, #ff8c00);
          color: white;
          border: none;
          padding: 8px 18px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: opacity 0.2s, transform 0.1s;
          display: inline-block;
        }
        .submit-btn:hover { opacity: 0.88; transform: translateY(-1px); }
      `}</style>

      <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

        {/* Header */}
        <header style={{ borderBottom: '1px solid #161616', position: 'sticky', top: 0, backgroundColor: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)', zIndex: 100 }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff4500" />
                    <stop offset="100%" stopColor="#ff8c00" />
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
            </div>

            {/* Navigation */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
              <a href="#" className="nav-link active">Charts</a>
              <a href="#" className="nav-link">Tools</a>
              <a href="#" className="nav-link">Blog</a>
              <a href="#" className="submit-btn">Submit Song</a>
            </nav>
          </div>
        </header>

        {/* Main */}
        <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '52px 24px 80px' }}>

          {/* Section Headline */}
          <div style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px' }}>
              <div style={{ width: '4px', height: '30px', background: 'linear-gradient(180deg, #ff4500, #ff8c00)', borderRadius: '2px', flexShrink: 0 }} />
              <h1 style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px' }}>Top 10 Charts</h1>
            </div>
            <p style={{ color: '#444', fontSize: '13px', paddingLeft: '18px' }}>
              Die meistbewerteten KI-generierten Songs — kuratiert von der Community
            </p>
          </div>

          {/* Column Labels */}
          {songs && songs.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 140px 120px', gap: '16px', padding: '0 20px 10px', borderBottom: '1px solid #161616', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: '#333', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', textAlign: 'center' }}>#</span>
              <span style={{ fontSize: '11px', color: '#333', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Song</span>
              <span style={{ fontSize: '11px', color: '#333', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', textAlign: 'center' }}>AI Tool</span>
              <span style={{ fontSize: '11px', color: '#333', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', textAlign: 'right' }}>Score</span>
            </div>
          )}

          {/* Chart Rows */}
          {songs && songs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {songs.map((song, index) => (
                <Link
                  key={song.id}
                  href={`/charts/${song.id}`}
                  className="chart-row"
                >
                  {/* Rank */}
                  <div style={{ textAlign: 'center' }}>
                    {index < 3 ? (
                      <span style={{
                        fontSize: '15px',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #ff4500, #ff8c00)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}>
                        {index + 1}
                      </span>
                    ) : (
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{index + 1}</span>
                    )}
                  </div>

                  {/* Song Info */}
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ fontWeight: '600', fontSize: '15px', color: '#f0f0f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {song.title}
                    </p>
                    <p style={{ fontSize: '13px', color: '#555', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {song.artist_name}
                    </p>
                  </div>

                  {/* AI Tool Badge */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: '#111',
                      color: '#ff8c00',
                      border: '1px solid #222',
                      letterSpacing: '0.2px',
                      whiteSpace: 'nowrap',
                    }}>
                      {song.ai_tool}
                    </span>
                  </div>

                  {/* Score + Bar */}
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
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{
              marginTop: '24px',
              padding: '72px 32px',
              textAlign: 'center',
              border: '1px solid #161616',
              borderRadius: '12px',
              background: '#0d0d0d',
            }}>
              <svg width="48" height="48" viewBox="0 0 34 34" fill="none" style={{ margin: '0 auto 20px', opacity: 0.2 }}>
                <defs>
                  <linearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff4500" />
                    <stop offset="100%" stopColor="#ff8c00" />
                  </linearGradient>
                </defs>
                <rect x="2"  y="14" width="4" height="6"  rx="2" fill="url(#emptyGrad)" />
                <rect x="8"  y="9"  width="4" height="16" rx="2" fill="url(#emptyGrad)" />
                <rect x="14" y="3"  width="4" height="28" rx="2" fill="url(#emptyGrad)" />
                <rect x="20" y="7"  width="4" height="20" rx="2" fill="url(#emptyGrad)" />
                <rect x="26" y="12" width="4" height="10" rx="2" fill="url(#emptyGrad)" />
              </svg>
              <p style={{ color: '#444', fontSize: '16px', marginBottom: '8px', fontWeight: '500' }}>
                Noch keine Songs in der Datenbank
              </p>
              <p style={{ color: '#2a2a2a', fontSize: '13px' }}>
                Charts erscheinen hier, sobald Songs hinzugefügt werden
              </p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid #111', padding: '24px', textAlign: 'center' }}>
          <p style={{ color: '#2a2a2a', fontSize: '12px' }}>
            © 2026 aimusik.eu · Europas KI-Musik-Chart-Plattform
          </p>
        </footer>

      </div>
    </>
  )
}
