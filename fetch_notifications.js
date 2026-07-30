import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cdcgwhmbcdmguvmgnwjr.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkY2d3aG1iY2RtZ3V2bWdud2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1MjIxMjIsImV4cCI6MjEwMDA5ODEyMn0.I4A9AwPa3Nrtt5Lw0sv-4WZ9n13H979QrJTCrkMCjno'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function getNotifications() {
  console.log('Fetching notifications from Supabase...')
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('Error fetching notifications:', error)
  } else {
    console.log('Notifications retrieved successfully:', JSON.stringify(data, null, 2))
  }
}

getNotifications()
