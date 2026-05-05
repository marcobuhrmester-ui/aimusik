-- Run this in the Supabase SQL Editor (https://app.supabase.com → SQL Editor)

-- 1. Add new fields to songs table
ALTER TABLE songs
  ADD COLUMN IF NOT EXISTS external_url TEXT,
  ADD COLUMN IF NOT EXISTS description  TEXT,
  ADD COLUMN IF NOT EXISTS is_active    BOOLEAN DEFAULT false;

-- Drop the ai_tool CHECK constraint so the harvest job can insert songs
-- with any ai_tool value (including 'Andere' for undetected tools)
ALTER TABLE songs DROP CONSTRAINT IF EXISTS songs_ai_tool_check;

-- Spotify deduplication column
ALTER TABLE songs ADD COLUMN IF NOT EXISTS spotify_id TEXT UNIQUE;

-- YouTube deduplication + cover art
ALTER TABLE songs ADD COLUMN IF NOT EXISTS youtube_id TEXT UNIQUE;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS cover_url  TEXT;

-- 30-second preview MP3 (Deezer: track.preview, Spotify: track.preview_url)
ALTER TABLE songs ADD COLUMN IF NOT EXISTS preview_url TEXT;

-- Genre classification
ALTER TABLE songs ADD COLUMN IF NOT EXISTS genre TEXT;
CREATE INDEX IF NOT EXISTS songs_genre_idx ON songs (genre);

-- Score recalculation function (called after each harvest run)
CREATE OR REPLACE FUNCTION calculate_scores()
RETURNS void AS $$
BEGIN
  -- Ensure every active song has at least score = 1
  UPDATE songs SET score = GREATEST(score, 1) WHERE is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 2. Chart history (last 4 weeks per song)
CREATE TABLE IF NOT EXISTS chart_history (
  id         BIGSERIAL PRIMARY KEY,
  song_id    BIGINT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  week_label TEXT   NOT NULL,  -- e.g. "KW 18 · 2026"
  position   INTEGER NOT NULL CHECK (position BETWEEN 1 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chart_history_song_id_idx ON chart_history (song_id);

-- 3. Community votes (1 per fingerprint per song)
CREATE TABLE IF NOT EXISTS community_votes (
  id          BIGSERIAL PRIMARY KEY,
  song_id     BIGINT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  fingerprint TEXT   NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (song_id, fingerprint)
);

CREATE INDEX IF NOT EXISTS community_votes_song_id_idx ON community_votes (song_id);
