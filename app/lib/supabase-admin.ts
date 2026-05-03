import { createClient } from '@supabase/supabase-js'

// Service-role key bypasses RLS — only use in server-side code, never expose to the browser.
// Add SUPABASE_SERVICE_ROLE_KEY to your environment variables (without NEXT_PUBLIC_ prefix).
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
