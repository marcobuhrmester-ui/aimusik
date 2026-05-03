'use client'

import { useState, useEffect } from 'react'
import { submitVote } from './actions'

function getOrCreateFingerprint(): string {
  const stored = localStorage.getItem('aimusik_fp')
  if (stored) return stored
  const fp = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
  localStorage.setItem('aimusik_fp', fp)
  return fp
}

const baseBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '13px 28px',
  borderRadius: '30px',
  fontSize: '15px',
  fontWeight: '700',
  border: 'none',
  cursor: 'pointer',
  transition: 'opacity 0.2s, transform 0.15s',
  userSelect: 'none',
}

export default function VoteButton({
  songId,
  initialCount,
}: {
  songId: number
  initialCount: number
}) {
  const [count, setCount] = useState(initialCount)
  const [hasVoted, setHasVoted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const votes = JSON.parse(localStorage.getItem('aimusik_votes') || '{}')
      if (votes[String(songId)]) setHasVoted(true)
    } catch {}
  }, [songId])

  async function handleVote() {
    if (hasVoted || loading) return
    setLoading(true)
    try {
      const fp = getOrCreateFingerprint()
      const result = await submitVote(songId, fp)
      if (result.success) {
        setCount((c) => c + 1)
        setHasVoted(true)
        const votes = JSON.parse(localStorage.getItem('aimusik_votes') || '{}')
        votes[String(songId)] = true
        localStorage.setItem('aimusik_votes', JSON.stringify(votes))
      } else if (result.error === 'already_voted') {
        setHasVoted(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const votedStyle: React.CSSProperties = {
    ...baseBtn,
    background: '#111',
    border: '1px solid #2a2a2a',
    color: '#ff8c00',
    cursor: 'not-allowed',
  }

  const activeStyle: React.CSSProperties = {
    ...baseBtn,
    background: 'linear-gradient(90deg, #ff4500, #ff8c00)',
    color: '#fff',
    opacity: loading ? 0.6 : 1,
  }

  if (!mounted) {
    return (
      <button disabled style={{ ...baseBtn, background: '#111', border: '1px solid #1a1a1a', color: '#444', cursor: 'default' }}>
        <HeartIcon />
        <span style={{ fontSize: '13px', opacity: 0.5 }}>{initialCount}</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleVote}
      disabled={hasVoted || loading}
      style={hasVoted ? votedStyle : activeStyle}
      onMouseEnter={(e) => { if (!hasVoted && !loading) e.currentTarget.style.opacity = '0.82' }}
      onMouseLeave={(e) => { if (!hasVoted && !loading) e.currentTarget.style.opacity = '1' }}
    >
      {hasVoted ? <CheckIcon /> : <HeartIcon />}
      <span>{hasVoted ? 'Gevotet' : loading ? 'Sende…' : 'Voten'}</span>
      <span style={{
        background: hasVoted ? '#1a1a1a' : 'rgba(0,0,0,0.2)',
        borderRadius: '12px',
        padding: '2px 9px',
        fontSize: '13px',
        fontWeight: '600',
      }}>
        {count}
      </span>
    </button>
  )
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}
