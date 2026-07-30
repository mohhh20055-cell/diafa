import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cdcgwhmbcdmguvmgnwjr.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkY2d3aG1iY2RtZ3V2bWdud2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1MjIxMjIsImV4cCI6MjEwMDA5ODEyMn0.I4A9AwPa3Nrtt5Lw0sv-4WZ9n13H979QrJTCrkMCjno'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkColumns() {
  console.log('الاستعلام عن أعمدة جدول الإشعارات (notifications)...')
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .limit(1)

  if (error) {
    console.error('خطأ في جلب البيانات:', error)
  } else if (data && data.length > 0) {
    console.log('أعمدة جدول notifications الموجودة:')
    console.table(Object.keys(data[0]))
    console.log('عينة من البيانات:', data[0])
  } else {
    console.log('الجدول فارغ، لكن يمكن إدراج سجل تجريبي أو استعلام مخطط قاعدة البيانات.')
  }
}

checkColumns()
