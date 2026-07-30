import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cdcgwhmbcdmguvmgnwjr.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkY2d3aG1iY2RtZ3V2bWdud2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1MjIxMjIsImV4cCI6MjEwMDA5ODEyMn0.I4A9AwPa3Nrtt5Lw0sv-4WZ9n13H979QrJTCrkMCjno'

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('[Diyafa] Missing Supabase environment variables in .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export default supabase
