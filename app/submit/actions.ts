'use server'

import { supabase } from '../lib/supabase'

export async function submitSong(data: {
  title: string
  artist_name: string
  ai_tool: string
  genre: string
  mood: string
  external_url: string
  description: string
}): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('songs').insert({
    title: data.title.trim(),
    artist_name: data.artist_name.trim(),
    ai_tool: data.ai_tool,
    genre: data.genre.trim() || null,
    mood: data.mood.trim() || null,
    external_url: data.external_url.trim() || null,
    description: data.description.trim() || null,
    score: 0,
    is_active: false,
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}
