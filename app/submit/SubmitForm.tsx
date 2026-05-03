'use client'

import { useState } from 'react'
import { submitSong } from './actions'

const AI_TOOLS = ['Suno', 'Udio', 'Stable Audio', 'MusicGen', 'ElevenLabs', 'Boomy', 'AIVA', 'Soundraw', 'Andere']

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0d0d0d',
  border: '1px solid #222',
  borderRadius: '8px',
  padding: '12px 16px',
  color: '#f0f0f0',
  fontSize: '15px',
  outline: 'none',
  transition: 'border-color 0.2s',
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: '600',
  color: '#555',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.7px',
  marginBottom: '8px',
}

export default function SubmitForm() {
  const [form, setForm] = useState({
    title: '',
    artist_name: '',
    ai_tool: '',
    genre: '',
    mood: '',
    external_url: '',
    description: '',
  })
  const [status, setStatus] = useState<'idle' | 'generating' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleGenerate() {
    if (!form.title || !form.artist_name || !form.ai_tool) return
    setStatus('generating')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          artist_name: form.artist_name,
          ai_tool: form.ai_tool,
          genre: form.genre,
          mood: form.mood,
        }),
      })
      const data = await res.json()
      if (data.description) set('description', data.description)
    } catch {}
    setStatus('idle')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.artist_name || !form.ai_tool) return
    setStatus('submitting')
    const result = await submitSong(form)
    if (result.success) {
      setStatus('success')
    } else {
      setErrorMsg(result.error ?? 'Unbekannter Fehler')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '60px 32px', background: '#0d0d0d', border: '1px solid #161616', borderRadius: '16px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '10px' }}>Song eingereicht!</h2>
        <p style={{ color: '#555', fontSize: '14px', lineHeight: '1.6' }}>
          Dein Song wird geprüft und erscheint nach Freischaltung in den Charts.
        </p>
      </div>
    )
  }

  const isLoading = status === 'generating' || status === 'submitting'
  const canSubmit = !isLoading && !!form.title && !!form.artist_name && !!form.ai_tool
  const canGenerate = !!form.title && !!form.artist_name && !!form.ai_tool && !isLoading

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <label style={labelStyle}>Titel *</label>
          <input
            style={inputStyle}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Song-Titel"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label style={labelStyle}>Artist / Alias *</label>
          <input
            style={inputStyle}
            value={form.artist_name}
            onChange={(e) => set('artist_name', e.target.value)}
            placeholder="Dein Künstlername"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>KI-Tool *</label>
        <select
          style={{ ...inputStyle, cursor: 'pointer' }}
          value={form.ai_tool}
          onChange={(e) => set('ai_tool', e.target.value)}
          required
          disabled={isLoading}
        >
          <option value="">Wähle ein KI-Tool…</option>
          {AI_TOOLS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <label style={labelStyle}>Genre</label>
          <input
            style={inputStyle}
            value={form.genre}
            onChange={(e) => set('genre', e.target.value)}
            placeholder="z.B. Electronic, Pop, Ambient…"
            disabled={isLoading}
          />
        </div>
        <div>
          <label style={labelStyle}>Mood</label>
          <input
            style={inputStyle}
            value={form.mood}
            onChange={(e) => set('mood', e.target.value)}
            placeholder="z.B. Chill, Energetic, Dark…"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Link zum Song</label>
        <input
          style={inputStyle}
          type="url"
          value={form.external_url}
          onChange={(e) => set('external_url', e.target.value)}
          placeholder="https://suno.com/…"
          disabled={isLoading}
        />
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Beschreibung</label>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 14px',
              background: canGenerate ? 'rgba(255,69,0,0.08)' : 'transparent',
              border: `1px solid ${canGenerate ? 'rgba(255,69,0,0.25)' : '#1a1a1a'}`,
              borderRadius: '20px',
              color: canGenerate ? '#ff6a00' : '#333',
              fontSize: '12px',
              fontWeight: '600',
              cursor: canGenerate ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
            </svg>
            {status === 'generating' ? 'Generiert…' : 'Mit KI generieren'}
          </button>
        </div>
        <textarea
          style={{ ...inputStyle, minHeight: '120px', resize: 'vertical', lineHeight: '1.6' }}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Optional: Beschreibe deinen Song oder nutze die KI-Generierung…"
          disabled={isLoading}
        />
      </div>

      {status === 'error' && (
        <p style={{ color: '#ef4444', fontSize: '13px', padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px' }}>
          Fehler: {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        style={{
          width: '100%',
          padding: '14px',
          background: canSubmit ? 'linear-gradient(90deg, #ff4500, #ff8c00)' : '#111',
          color: canSubmit ? '#fff' : '#333',
          border: '1px solid #1e1e1e',
          borderRadius: '10px',
          fontSize: '15px',
          fontWeight: '700',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
        }}
      >
        {status === 'submitting' ? 'Wird eingereicht…' : 'Song einreichen'}
      </button>

    </form>
  )
}
