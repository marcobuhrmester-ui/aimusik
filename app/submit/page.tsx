import Link from 'next/link'
import SubmitForm from './SubmitForm'

export default function SubmitPage() {
  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
        .nav-link { color: #555; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        .nav-link:hover { color: #ff6a00; }
        .submit-btn { background: linear-gradient(90deg, #ff4500, #ff8c00); color: white; border: none; padding: 8px 18px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: none; transition: opacity 0.2s, transform 0.1s; display: inline-block; }
        .submit-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        input:focus, select:focus, textarea:focus { border-color: #ff4500 !important; }
        input::placeholder, textarea::placeholder { color: #2a2a2a; }
        option { background: #0d0d0d; }
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
              <a href="#" className="nav-link">Tools</a>
              <a href="#" className="nav-link">Blog</a>
              <Link href="/submit" className="submit-btn">Submit Song</Link>
            </nav>
          </div>
        </header>

        <main style={{ maxWidth: '680px', margin: '0 auto', padding: '52px 24px 80px' }}>

          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px' }}>
              <div style={{ width: '4px', height: '30px', background: 'linear-gradient(180deg, #ff4500, #ff8c00)', borderRadius: '2px', flexShrink: 0 }} />
              <h1 style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px' }}>Song einreichen</h1>
            </div>
            <p style={{ color: '#444', fontSize: '13px', paddingLeft: '18px' }}>
              Reiche deinen KI-generierten Song ein und lass ihn von der Community bewerten
            </p>
          </div>

          <SubmitForm />

        </main>

        <footer style={{ borderTop: '1px solid #111', padding: '24px', textAlign: 'center' }}>
          <p style={{ color: '#2a2a2a', fontSize: '12px' }}>© 2026 aimusik.eu · Europas KI-Musik-Chart-Plattform</p>
        </footer>
      </div>
    </>
  )
}
