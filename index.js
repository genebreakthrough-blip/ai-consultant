import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  const { data, error } = await supabase
    .from('documents')       // <-- use your table name
    .select('*')

  if (error) {
    console.error('❌ Error:', error)
  } else {
    console.log('✅ Connected. Data:', data)
  }
}

testConnection()
