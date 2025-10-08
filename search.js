import 'dotenv/config'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

// Clients
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
const openai   = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function searchDocuments(query) {
  // 1) Make a query embedding
  const embResp = await openai.embeddings.create({
    model: 'text-embedding-3-small',   // 1536-dim
    input: query
  })
  const queryEmbedding = embResp.data[0].embedding
  console.log('query embedding length =', queryEmbedding.length) // should be 1536

  // 2) Call the Supabase RPC
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_count: 5,
    match_threshold: 0.0     // start relaxed; raise later (e.g., 0.6–0.8)
  })

  if (error) {
    console.error('❌ RPC error:', error)
    return
  }

  // 3) Print results
  console.log('🔎 Results:')
  for (const row of data) {
    console.log(`${row.similarity.toFixed(3)}  ${row.title}`)
  }
}

// allow: node search.js "your query"
const query = process.argv.slice(2).join(' ') || 'test document embeddings'
searchDocuments(query)
