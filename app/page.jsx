'use client';

import { useEffect, useRef, useState } from 'react';

const EXAMPLES = [
  'What does PPAR-γ do in metabolism?',
  'Is there evidence chlorella helps blood sugar?',
  'Summarize key mechanisms of PPARs (γ, α, δ).',
];

export default function Home() {
  const [messages, setMessages] = useState([]); // [{role:'user'|'assistant', content:string}]
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollerRef = useRef(null);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function onSubmit(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question) return;

    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question }),
      });
      if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);

      const data = await res.json().catch(() => ({}));
      const content =
        (data && (data.response ?? data.reply ?? data.message)) ??
        (typeof data === 'string' ? data : '(no reply)');

      setMessages(prev => [...prev, { role: 'assistant', content }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Error: ${String(err.message || err)}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const useExample = (t) => setInput(t);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background halos */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_at_30%_30%,#f0abfc_0%,transparent_60%)] opacity-30 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_at_70%_30%,#93c5fd_0%,transparent_60%)] opacity-30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle_at_50%_70%,#fde68a_0%,transparent_55%)] opacity-20 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-5 md:px-10 lg:px-16 py-8 md:py-12">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Glowing orb */}
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,#a78bfa_0%,#60a5fa_25%,#f472b6_50%,#facc15_75%,#a78bfa_100%)] opacity-90 animate-orb" />
              <div className="absolute inset-[12%] rounded-full bg-black/70 backdrop-blur-xl" />
              <div className="absolute inset-[30%] rounded-full bg-white/70 blur-[2px]" />
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white/95">
                ARC — AI Health Consultant
              </h1>
              <p className="text-xs md:text-sm text-white/60">
                Grounded answers from your notes (PPAR, chlorella, etc.). No medical advice.
              </p>
            </div>
          </div>

          <div className="hidden md:flex">
            <button
              className="rounded-full px-4 py-2 text-sm text-white/85 border border-white/10 bg-white/5 hover:bg-white/10 transition"
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            >
              Ask anything
            </button>
          </div>
        </header>

        {/* Quick tiles (only when empty) */}
        {messages.length === 0 && (
          <section className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { t: EXAMPLES[0], label: "Speak with ARC", emoji: "💬" },
              { t: EXAMPLES[1], label: "Evidence check", emoji: "🧪" },
              { t: EXAMPLES[2], label: "Mechanisms", emoji: "🧠" },
              { t: "", label: "Summaries", emoji: "📑", disabled: true },
              { t: "", label: "Literature", emoji: "🔎", disabled: true },
              { t: "", label: "Settings", emoji: "⚙️", disabled: true },
            ].map((item, idx) => (
              <button
                key={idx}
                disabled={item.disabled}
                onClick={() => !item.disabled && useExample(item.t)}
                className={`group relative overflow-hidden rounded-2xl p-4 text-left w-full aspect-[1.15]
                  bg-[radial-gradient(120%_140%_at_80%_-10%,rgba(255,255,255,.12),rgba(255,255,255,0)_60%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.04))]
                  border border-white/10 backdrop-blur-xl
                  shadow-[0_10px_30px_rgba(0,0,0,.45)] hover:shadow-[0_20px_60px_rgba(0,0,0,.55)]
                  transition ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="absolute -right-10 -top-10 opacity-70">
                  <div className="h-20 w-20 rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,#a78bfa,#60a5fa,#f472b6,#facc15,#a78bfa)] opacity-70 blur-[1px]" />
                </div>
                <div className="relative z-10 flex h-full flex-col justify-between">
                  <div>
                    <div className="text-white/85 text-base font-semibold">{item.label}</div>
                    <div className="text-white/60 text-xs mt-1 leading-snug">{item.emoji}</div>
                  </div>
                  {!item.disabled && <div className="text-white/60 text-xs">Tap to insert →</div>}
                </div>
              </button>
            ))}
          </section>
        )}

        {/* Chat surface */}
        <section className="mt-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_20px_70px_rgba(0,0,0,.45)]">
            {/* scrollable conversation */}
            <div ref={scrollerRef} className="max-h-[62vh] overflow-y-auto p-5 md:p-6 space-y-3">
              {messages.map((m, i) => {
                const isUser = m.role === 'user';
                return (
                  <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <div className="mr-3 mt-1 text-[10px] h-6 px-2 inline-flex items-center rounded-full bg-white/10 text-white/80 border border-white/15">
                        ARC
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] md:max-w-[70%] whitespace-pre-wrap leading-relaxed
                        rounded-2xl px-4 py-3 border
                        ${isUser
                          ? 'bg-blue-600/80 border-blue-400/30 text-white shadow-[0_6px_25px_rgba(37,99,235,.25)]'
                          : 'bg-white/8 border-white/15 text-white/95'}`
                      }
                    >
                      {m.content}
                    </div>
                    {isUser && (
                      <div className="ml-3 mt-1 text-[10px] h-6 px-2 inline-flex items-center rounded-full bg-white/10 text-white/80 border border-white/15">
                        You
                      </div>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-3">
                  <div className="text-[10px] h-6 px-2 inline-flex items-center rounded-full bg-white/10 text-white/80 border border-white/15">
                    ARC
                  </div>
                  <div className="rounded-2xl px-4 py-3 border bg-white/8 border-white/15 text-white/90">
                    <span className="inline-flex items-center gap-2">
                      Thinking <span className="typing-dots"><span>.</span><span>.</span><span>.</span></span>
                    </span>
                  </div>
                </div>
              )}

              {messages.length === 0 && !loading && (
                <div className="text-white/50 text-sm">
                  Ask about PPARs, chlorella, mechanisms, use-cases…
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-white/10 p-4 md:p-5">
              <form onSubmit={onSubmit} className="flex items-end gap-3 w-full">
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onSubmit(e);
                    }
                  }}
                  placeholder="Ask anything…"
                  className="ui-input flex-1 resize-none rounded-xl bg-white/5 text-white placeholder-white/40 border border-white/10 focus:border-white/20 focus:outline-none focus:ring-0 px-4 py-3"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-5 py-3 text-sm font-medium shadow-[0_10px_30px_rgba(37,99,235,.35)]"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>

      {/* tiny keyframes for glow/dots */}
      <style jsx global>{`
        @keyframes orb { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        .animate-orb { animation: orb 3.2s ease-in-out infinite; }
        .typing-dots span {
          animation: bounce 1.2s infinite;
          display:inline-block; padding:0 .05rem;
        }
        .typing-dots span:nth-child(2){ animation-delay: .15s }
        .typing-dots span:nth-child(3){ animation-delay: .3s }
        @keyframes bounce{0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-3px)}}
      `}</style>
    </div>
  );
}
