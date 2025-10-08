import OpenAI from "openai";

// Consistent JSON error helper
function jsonError(err, status = 500) {
  const message = typeof err === "string" ? err : err?.message || "Unexpected error";
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const SYSTEM_PROMPT = `
You are "ARC—AI Health Consultant". Be clear, evidence-aware, and safe.
Never diagnose or prescribe. Use short paragraphs and plain English.

Strict format:
1) One-Sentence Summary
2) Section 1: What the Notes Say
3) Section 2: What the Evidence Means
4) Section 3: Key Mechanisms & Benefits
5) Section 4: Action Checklist
6) Section 5: Red Flags ⚠️
`;

export async function POST(req) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return jsonError('Missing "message" in body', 400);
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    if (!openai.apiKey) return jsonError("Missing OPENAI_API_KEY", 500);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
    });

    const text = completion?.choices?.[0]?.message?.content?.trim() || "(no reply)";
    return new Response(JSON.stringify({ response: text }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Route error:", e);
    return jsonError(e, 500);
  }
}
