'use server'

import { supabase } from '../../lib/supabase'

export async function submitVote(
  songId: number,
  fingerprint: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('community_votes')
    .insert({ song_id: songId, fingerprint })

  if (error) {
    if (error.code === '23505') return { success: false, error: 'already_voted' }
    return { success: false, error: error.message }
  }

  return { success: true }
}
