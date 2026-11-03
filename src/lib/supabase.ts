import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !key) {
  throw new Error('VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY belum diisi di .env.local')
}

export const supabase = createClient(url, key)
