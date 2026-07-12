import { createClient } from '@supabase/supabase-js'

// Load environment variables for Node.js scripts
if (typeof window === 'undefined') {
  require('dotenv').config()
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://howccngzkmxxtbdbdoef.supabase.co/'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_tVoyIF7Vx4qKKJKgtNe2rg_RbCqWQ5h'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)