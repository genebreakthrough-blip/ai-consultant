import 'dotenv/config'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai   = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

async function backfill() {
  // 1) fetch rows missing embeddings
  const { data: rows, error: fetchErr } = await supabase
    .from('documents')
    .select('id, title, content')
    .is('embedding', null)

  if (fetchErr) return console.error('❌ fetchErr:', fetchErr)
  if (!rows?.length) return console.log('✅ No rows need backfilling.')

  console.log(`Found ${rows.length} rows to backfill...`)

  for (const row of rows) {
    // 2) make an embedding
    const resp = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: row.content ?? ''
    })
    const embedding = resp.data[0].embedding

    // 3) update that row
    const { error: updErr } = await supabase
      .from('documents')
      .update({ embedding })
      .eq('id', row.id)

    if (updErr) console.error(`❌ update failed for ${row.id}:`, updErr)
    else console.log(`✅ backfilled: ${row.title} (${row.id})`)
  }
}

backfill()
