import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(request: Request) {
  try {
    const { title, artist_name, genre, mood, ai_tool } = await request.json()

    if (!title || !artist_name || !ai_tool) {
      return NextResponse.json({ error: 'title, artist_name und ai_tool sind erforderlich' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 512,
      system: [
        {
          type: 'text',
          text: 'Du bist ein kreativer Musikjournalist, der mit Begeisterung über KI-generierte Musik schreibt. Du schreibst kurze, präzise Beschreibungen auf Deutsch. Antworte immer direkt mit der Beschreibung, ohne Einleitung, ohne Präfix wie "Beschreibung:" oder ähnliches.',
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Schreibe genau 3 Sätze auf Deutsch über diesen KI-generierten Song. Erwähne das Genre, den Mood und das KI-Tool.

Titel: "${title}"
Artist: ${artist_name}
KI-Tool: ${ai_tool}
Genre: ${genre || 'nicht angegeben'}
Mood: ${mood || 'nicht angegeben'}`,
        },
      ],
    })

    const description =
      message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    return NextResponse.json({ description })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
