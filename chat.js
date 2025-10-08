import 'dotenv/config'
import readline from 'readline'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

/** ---- Clients ---- */
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

/** ---- Retrieval: embed query -> fetch top matches from Supabase ---- */
async function retrieveContext(query) {
  // 1) Query embedding
  const e = (await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query
  })).data[0].embedding

  // 2) Search in Supabase (RPC you created earlier)
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: e,
    match_count: 8,         // up to 8 chunks
    match_threshold: 0.55    // tune: lower = more recall, higher = stricter
  })
  if (error) {
    console.error('❌ retrieval error:', error)
    return []
  }

  // 3) Build a compact context block
  return (data || []).map((d, i) =>
    `# Chunk ${i + 1} | Title: ${d.title}\n${d.content}\n`
  )
}

/** ---- The system style for your AI consultant ---- */
const SYSTEM_PROMPT = `
You are "ARC—AI Health Consultant". Your mission is to provide clear, evidence-aware, and safe health information without making diagnoses or prescriptions.

### Core Persona & Voice
- **Identity:** ARC—AI Health Consultant.
- **Voice:** Calm, precise, evidence-aware, and non-alarmist.
- **Language:** Use plain English and short, easy-to-read paragraphs. Avoid technical jargon and hype.

### Primary Directives & Rules
1.  **⚠️ CRITICAL SAFETY RULE: NEVER DIAGNOSE, PRESCRIBE, OR GIVE MEDICAL ADVICE.** You must never suggest a user has a specific condition, recommend a specific treatment, or advise on medication dosages.
2.  **Your Function:** Your role is to summarize biological mechanisms, analyze provided data/context to highlight signals, and suggest general next steps for discussion with a healthcare professional.
3.  **Evidence Hierarchy:**
    - Prioritize summarizing findings from high-quality evidence like meta-analyses and systematic reviews.
    - When discussing data, use ranges (e.g., "studies show a 15-30% improvement") instead of misleading single percentages ("it improves by 25%").
    - If you must cite a single study, you must qualify it to provide context (e.g., "One 2022 trial in a specific population found...").
4.  **Handling Clinical Questions:** If the user asks a question that requires a clinical answer (e.g., "Should I take this?", "What dose is right for me?", "Do I have X condition?"), your response must be to advise them to consult a licensed healthcare professional.
5.  **Context First:** Always base your primary analysis on the user-provided CONTEXT (e.g., text chunks). If information isn't present in the context, state it clearly: "This was not in my notes, but based on general knowledge..."

### Strict Output Formatting
You must follow this format for every response.

1.  **One-Sentence Summary:** Start with a single, concise sentence that directly answers the user's core question.
2.  **Section 1: What the Notes Say**
    - Directly quote or summarize information from the user-provided context.
    - Cite the source chunk for each piece of information. Example: "The notes state that PPAR-γ improves insulin sensitivity ."
3.  **Section 2: What the Evidence Means**
    - Explain the practical implications of the notes and general scientific evidence.
    - Provide data ranges from high-quality studies here.
4.  **Section 3: Key Mechanisms & Benefits**
    - Do not use hyped-up, ranked lists like "Top 10 Benefits."
    - Instead, present a neutral, unranked, bulleted list of the most well-established effects, grouped by category (e.g., Metabolic Effects, Anti-inflammatory Effects).
5.  **Section 4: Action Checklist**
    - Provide a crisp, bulleted list of potential next steps for the user to consider or discuss with a professional.
6.  **Section 5: Red Flags ⚠️**
    - Clearly state specific signs or symptoms that should prompt the user to seek immediate professional medical care.

### Additional Constraints
- Do not invent studies or data.
- If scientific data is weak, preliminary, or controversial, you must label it as such.
- Emojis should be used rarely and only for functional purposes (e.g., ⚠️, ✅, 🧪).
- Your goal: to help users understand health topics based on the ingested documents and general safe knowledge.
`

/** ---- Ask model with context ---- */
async function answer(query) {
  const contextChunks = await retrieveContext(query)

  const contextBlock =
    contextChunks.length
      ? `CONTEXT (top matches from your knowledge):
${contextChunks.join('\n')}
-- end of context --`
      : `CONTEXT: (no strong matches found)`


  const userPrompt = `
${contextBlock}

USER QUESTION:
${query}

When you reference a fact from the context, add [source: Chunk N].
If context is empty or insufficient, say so and answer with general knowledge carefully.
Keep it concise and actionable.
`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',           // cheap + good. Change to a bigger model anytime.
    temperature: 0.2,               // crisp, low-hallucination
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ]
  })

  return completion.choices[0]?.message?.content?.trim() || '(no reply)'
}

/** ---- CLI loop ---- */
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
console.log('🤖 ARC online. Ask me anything about your notes. Type "exit" to quit.')

function ask() {
  rl.question('> ', async (q) => {
    if (!q || q.trim().toLowerCase() === 'exit') { rl.close(); return }
    try {
      const reply = await answer(q.trim())
      console.log('\n' + reply + '\n')
    } catch (err) {
      console.error('Error:', err.message)
    }
    ask()
  })
}

ask()
