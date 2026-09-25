// "Ask my learnings" with canned demo answers, ported from the design.
// ponytail: keyword matching only. Real answers (Cloudflare AI Search + a Worker) are planned in docs/plan.md.
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Hub } from '../App.tsx';
import { fmtMin } from '../../lib/plan.ts';
import { Icon, TRACK } from '../ui.tsx';

type Msg = { role: 'user' | 'ai'; text: string; src?: string[] };

const SUGGEST = ['What should I do today?', 'How do I evaluate a RAG system?', 'MCP vs function calling?', 'How do I keep API spend under $20?'];

function answer(hub: Hub, q: string): Omit<Msg, 'role'> {
  const l = q.toLowerCase();
  const { plan, day } = hub;
  if (/today|next|plan|week|do\b/.test(l)) {
    const tasks = plan.tasksByDay[day];
    if (!tasks.length) return { text: `Day ${day} is a rest or race day. No tasks.`, src: ['Plan at a glance'] };
    const p = plan.phaseOf(day);
    return {
      text: `Day ${day} sits in ${p.number ? `week ${p.number}` : 'the final days'}: ${p.title}.\n\n${tasks.map((t) => `• ${fmtMin(t.min)} ${TRACK[t.kind].label.toLowerCase()}: ${t.title}`).join('\n')}`,
      src: ['Plan at a glance', 'Daily rhythm'],
    };
  }
  if (/eval|judge|faithful/.test(l)) return { text: 'Start with error analysis on real traces, not metrics. Label 40–50 questions by type (factual, multi-hop, not in corpus, adversarial). Score retrieval and answers separately, and calibrate any LLM judge against your own labels with binary scores.', src: ['AI Evals FAQ', 'LLM-as-a-Judge guide'] };
  if (/mcp|function call|tool/.test(l)) return { text: 'Function calling defines tools inside one app. MCP is a protocol, so one server works across many clients. Build against the 2026-07-28 spec: a stateless core with no initialize handshake. Watch context size with large tool catalogues.', src: ['MCP spec 2026-07-28', 'Code execution with MCP'] };
  if (/cost|budget|spend|\$|cheap/.test(l)) return { text: 'Keep LLM APIs around $10–15 a month on one or two providers with hard caps. Iterate prompts and retrieval on local models, and cache judge outputs keyed by a hash of (input, output, judge prompt). Avoid a full GraphRAG index.', src: ['Budget', 'LiteLLM'] };
  if (/rag|retriev|chunk|hybrid|rerank/.test(l)) return { text: 'Hybrid search (BM25 + vector with RRF), then a cross-encoder reranker. Contextual retrieval cut retrieval failures by 35%, 49% with contextual BM25, and 67% with reranking. Under ~200k tokens, consider skipping RAG.', src: ['Contextual Retrieval', 'Supabase hybrid search'] };
  if (/owasp|inject|security|attack/.test(l)) return { text: 'Treat every tool output and retrieved chunk as untrusted. Use least-privilege tools, allow-lists and human approval for side effects. Map each tool to the OWASP Agentic Top 10: goal hijack, tool misuse, privilege abuse.', src: ['OWASP Agentic Top 10', 'OWASP LLM Top 10 2026'] };
  return { text: "Nothing in the notes matches that yet. Try asking about today's plan, RAG, evals, MCP, security or cost.", src: [] };
}

export default function Ask({ hub }: { hub: Hub }) {
  const [chat, setChat] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    setChat((c) => [...c, { role: 'user', text: t }]);
    setInput('');
    setBusy(true);
    timer.current = setTimeout(() => {
      setChat((c) => [...c, { role: 'ai', ...answer(hub, t) }]);
      setBusy(false);
    }, 750);
  };
  const submit = (e: FormEvent) => { e.preventDefault(); send(input); };

  return (
    <section className="screen" aria-label="Ask my learnings" style={{ maxWidth: 860, gap: 14 }}>
      <div>
        <div className="line" style={{ gap: 10 }}>
          <h1 className="h1">Ask my learnings</h1>
          <span className="pill solid" style={{ fontSize: 12, padding: '4px 12px' }}>Coming soon</span>
        </div>
        <p className="lede">Answers drawn from hub notes and the resource library.</p>
      </div>
      <div className="panel sage" role="note" style={{ gap: 6 }}>
        <span className="title">Coming soon</span>
        <span className="pretty" style={{ fontSize: 13 }}>
          Real answers, with sources, from your daily log, hub notes and the resource library. Until then this chat gives
          canned demo answers on a few topics: today's plan, RAG, evals, MCP, security and cost.
        </span>
      </div>
      <div className="chat">
        <div className="stack" style={{ flex: 1, gap: 12 }} aria-live="polite">
          {!chat.length && !busy && (
            <div className="stack" style={{ gap: 12, padding: '12px 4px' }}>
              <span className="heading" style={{ fontSize: 22 }}>What do you want to recall?</span>
              <div className="line">
                {SUGGEST.map((s) => <button key={s} type="button" className="chip" onClick={() => send(s)}>{s}</button>)}
              </div>
            </div>
          )}
          {chat.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              <span>{m.text}</span>
              {!!m.src?.length && <div className="line" style={{ gap: 6 }}>{m.src.map((s) => <span key={s} className="pill warm">{s}</span>)}</div>}
            </div>
          ))}
          {busy && <div className="typing" aria-label="Thinking"><span /><span /><span /></div>}
        </div>
        <form className="composer" onSubmit={submit}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about RAG, MCP, evals, cost…" aria-label="Ask a question" maxLength={300} />
          <button type="submit" className="send" aria-label="Send"><Icon name="send" /></button>
        </form>
      </div>
    </section>
  );
}
