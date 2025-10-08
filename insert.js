import 'dotenv/config'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function insertDocument(title, content) {
  // 1) create an embedding with OpenAI
  const resp = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: content
  })
  const embedding = resp.data[0].embedding

  // 2) insert into Supabase
  const { data, error } = await supabase
    .from('documents')
    .insert([{ title, content, embedding }])
    .select('id, title')

  if (error) {
    console.error('❌ Insert error:', error)
  } else {
    console.log('✅ Inserted row:', data)
  }
}

// test insert
insertDocument('Embedding Test', 'This is a test document for embeddings.')
