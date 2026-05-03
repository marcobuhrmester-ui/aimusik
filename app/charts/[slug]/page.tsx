import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default async function SongPage({ params }: { params: { slug: string } }) {
  noStore()

  const { data: song } = await supabase
    .from('songs')
    .select('*')
    .eq('id', params.slug)
    .single()

  if (!song) notFound()

  const stats = [
    { label: 'Score', value: `${song.score.toLocaleString()} pts`, highlight: true },
    { label: 'Streams', value: song.streams ? song.streams.toLocaleString() : '–' },
    { label: 'Genre', value: song.genre || '–' },
    { label: 'Mood', value: song.mood || '–' },
  ]

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
        .nav-link { color: #555; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        .nav-link:hover { color: #ff6a00; }
        .back-link { display: inline-flex; align-items: center; gap: 6px; color: #444; text-decoration: none; font-size: 13px; font-weight: 500; transition: color 0.2s; }
        .back-link:hover { color: #ff6a00; }
        .stat-card { background: #0d0d0d; border: 1px solid #161616; border-radius: 12px; padding: 24px; transition: border-color 0.2s; }
        .stat-card:hover { border-color: #2a2a2a; }
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

            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
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
            </Link>

            <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
              <Link href="/" className="nav-link">Charts</Link>
              <a href="#" className="nav-link">Tools</a>
              <a href="#" className="nav-link">Blog</a>
              <a href="#" className="submit-btn">Submit Song</a>
            </nav>
          </div>
        </header>

        <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 80px' }}>

          {/* Back */}
          <Link href="/" className="back-link" style={{ marginBottom: '40px', display: 'inline-flex' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Zurück zu Charts
          </Link>

          {/* Hero */}
          <div style={{ marginTop: '40px', marginBottom: '48px' }}>
            {/* Decorative wave */}
            <div style={{ marginBottom: '28px', opacity: 0.15 }}>
              <svg width="60" height="40" viewBox="0 0 34 34" fill="none">
                <defs>
                  <linearGradient id="heroWave" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff4500" />
                    <stop offset="100%" stopColor="#ff8c00" />
                  </linearGradient>
                </defs>
                <rect x="2"  y="14" width="4" height="6"  rx="2" fill="url(#heroWave)" />
                <rect x="8"  y="9"  width="4" height="16" rx="2" fill="url(#heroWave)" />
                <rect x="14" y="3"  width="4" height="28" rx="2" fill="url(#heroWave)" />
                <rect x="20" y="7"  width="4" height="20" rx="2" fill="url(#heroWave)" />
                <rect x="26" y="12" width="4" height="10" rx="2" fill="url(#heroWave)" />
              </svg>
            </div>

            <h1 style={{ fontSize: '52px', fontWeight: '800', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: '14px', background: 'linear-gradient(135deg, #ffffff 40%, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {song.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '18px', color: '#666', fontWeight: '500' }}>
                {song.artist_name}
              </span>
              <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#333', display: 'inline-block' }} />
              <span style={{
                padding: '5px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '700',
                background: 'rgba(255, 140, 0, 0.08)',
                color: '#ff8c00',
                border: '1px solid rgba(255, 140, 0, 0.2)',
                letterSpacing: '0.3px',
                textTransform: 'uppercase',
              }}>
                {song.ai_tool}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '48px' }}>
            {stats.map(({ label, value, highlight }) => (
              <div key={label} className="stat-card">
                <p style={{ fontSize: '11px', color: '#444', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
                  {label}
                </p>
                <p style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  ...(highlight
                    ? { background: 'linear-gradient(90deg, #ff4500, #ff8c00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }
                    : { color: '#d0d0d0' }),
                }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'linear-gradient(90deg, #ff4500 0%, transparent 60%)', opacity: 0.2, marginBottom: '48px' }} />

          {/* Meta Info */}
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            {[
              { label: 'Artist', value: song.artist_name },
              { label: 'AI Tool', value: song.ai_tool },
              ...(song.genre ? [{ label: 'Genre', value: song.genre }] : []),
              ...(song.mood ? [{ label: 'Mood', value: song.mood }] : []),
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: '11px', color: '#333', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>{label}</p>
                <p style={{ fontSize: '15px', color: '#aaa', fontWeight: '500' }}>{value}</p>
              </div>
            ))}
          </div>

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
