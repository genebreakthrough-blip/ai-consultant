import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// ~1200 chars per chunk, 200 overlap (simple + good enough)
function chunkText(str, size = 1200, overlap = 200) {
  const clean = str.replace(/\s+/g, ' ').trim()
  const chunks = []
  let i = 0
  while (i < clean.length) {
    chunks.push(clean.slice(i, i + size))
    i += size - overlap
  }
  return chunks
}

async function embedAndInsert(title, text) {
  const chunks = chunkText(text)
  console.log(`→ ${title}: ${chunks.length} chunks`)
  for (let idx = 0; idx < chunks.length; idx++) {
    const chunk = chunks[idx]
    const emb = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunk
    })
    const embedding = emb.data[0].embedding
    const { error } = await supabase.from('documents').insert([
      {
        title: `${title} (part ${idx + 1}/${chunks.length})`,
        content: chunk,
        embedding
      }
    ])
    if (error) {
      console.error('❌ insert error:', error)
    } else {
      console.log(`   ✓ saved part ${idx + 1}`)
    }
  }
}

async function run() {
  const dir = path.resolve('data')
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.txt') || f.endsWith('.md'))
  if (files.length === 0) {
    console.log('No .txt or .md files found in /data')
    return
  }
  for (const file of files) {
    const full = path.join(dir, file)
    const text = fs.readFileSync(full, 'utf8')
    await embedAndInsert(file, text)
  }
  console.log('✅ Done.')
}

run()
