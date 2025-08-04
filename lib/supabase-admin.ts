import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// This requires the service role key to create users
// WARNING: This should only be used in API routes, never on the client side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})