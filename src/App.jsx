import { useState, useEffect, useRef, useCallback } from "react";
import { generateProbe, recordProbeResult, detectContext } from "./probeEngine";

// ═══════════════════════════════════════════════════════════
// DATA MODEL
// ═══════════════════════════════════════════════════════════

const INITIAL_USER = {
  name: "Node #4f9c",
  contribution: 0,
  sessionsToday: 0,
  totalContributions: 23,
  myceliumIndex: 0.61,
  metrics: {
    semanticConvergence: 0.67,
    temporalSynchrony:   0.54,
    predictiveCoherence: 0.71,
    alignmentScore:      0.63,
    cognitiveDrift:      0.28,
  },
};

const GLOBAL = {
  myceliumIndex:       0.74,
  activeNodes:         914203,
  countriesReached:    97,
  questionsProcessed:  48291,
  jammingCities:       ["Athens", "São Paulo", "Seoul", "Lagos"],
};

const TASKS = [
  {
    id: "t1", type: "Daily Question", done: false,
    q: "Which of these feels closer to what you expect from tomorrow?",
    kind: "choice",
    options: [
      "Things will proceed as normal",
      "Something will feel slightly off",
      "An event will interrupt routine",
      "Nothing will be clear until it happens",
    ],
  },
  {
    id: "t2", type: "Abstract Prompt", done: false,
    q: "What single word does this symbol suggest to you?",
    kind: "word",
    symbol: "≋",
  },
  {
    id: "t3", type: "Micro-Decision", done: false,
    q: "You must choose a direction without knowing the destination.",
    kind: "choice",
    options: [
      "Left — follow the familiar pattern",
      "Right — into undefined space",
      "Wait — let others move first",
      "Back — re-examine what you passed",
    ],
  },
  {
    id: "t4", type: "Puzzle Task", done: false,
    q: "Which element completes the sequence?",
    kind: "sequence",
    seq: ["△", "◎", "▽", "?"],
    options: ["◉", "⬡", "△", "□"],
    correct: 0,
  },
  {
    id: "t5", type: "Contextual Question", done: false,
    q: "Right now, the majority of network participants report feeling —",
    kind: "choice",
    options: [
      "A low-grade anticipation with no clear object",
      "Ordinary fatigue from the week",
      "A sense that something is converging",
      "Disconnected from the usual rhythms",
    ],
  },
];

const JAM_MAP_NODES = [
  { id: "athens",    label: "Athens",     x: 55, y: 33, size: 18, severity: 0.91, jamIndex: 0.91, active: true,  pop: "Athens, GR · Index: 91% · Active since 04:17" },
  { id: "seoul",     label: "Seoul",      x: 79, y: 28, size: 16, severity: 0.84, jamIndex: 0.84, active: true,  pop: "Seoul, KR · Index: 84% · Active since 08:03" },
  { id: "saopaulo",  label: "São Paulo",  x: 27, y: 63, size: 14, severity: 0.77, jamIndex: 0.77, active: true,  pop: "São Paulo, BR · Index: 77% · Active since 14:52" },
  { id: "lagos",     label: "Lagos",      x: 49, y: 53, size: 12, severity: 0.71, jamIndex: 0.71, active: true,  pop: "Lagos, NG · Index: 71% · Active since 09:30" },
  { id: "london",    label: "London",     x: 44, y: 24, size: 8,  severity: 0.44, jamIndex: 0.44, active: false, pop: "London, UK · Index: 44% · Monitoring" },
  { id: "chicago",   label: "Chicago",    x: 19, y: 32, size: 8,  severity: 0.38, jamIndex: 0.38, active: false, pop: "Chicago, US · Index: 38% · Monitoring" },
  { id: "mumbai",    label: "Mumbai",     x: 68, y: 45, size: 9,  severity: 0.52, jamIndex: 0.52, active: false, pop: "Mumbai, IN · Index: 52% · Elevated" },
  { id: "nairobi",   label: "Nairobi",    x: 57, y: 55, size: 7,  severity: 0.34, jamIndex: 0.34, active: false, pop: "Nairobi, KE · Index: 34% · Normal" },
  { id: "berlin",    label: "Berlin",     x: 51, y: 21, size: 7,  severity: 0.41, jamIndex: 0.41, active: false, pop: "Berlin, DE · Index: 41% · Monitoring" },
  { id: "sydney",    label: "Sydney",     x: 83, y: 73, size: 8,  severity: 0.47, jamIndex: 0.47, active: false, pop: "Sydney, AU · Index: 47% · Monitoring" },
];

const RESEARCH_CARDS = [
  {
    id: "r1", tag: "findings", tagLabel: "Key Findings",
    title: "Cognitive precedence of Jam events",
    abstract: "In 6 of 9 documented Type-II Jam events, a statistically significant spike in the Mycelium Index preceded the physical jam onset by 14–40 minutes. The signal is not strong enough to qualify as predictive, but it is consistent enough to exclude coincidence at p < 0.05.",
    findings: [
      { n: "01", text: "Athens March event: Index peaked at 0.91 exactly 23 minutes before jam formation. Peak involved 88,400 active nodes across 14 independent cohorts." },
      { n: "02", text: "Seoul event: Distributed resonance across 14 districts. Near-identical pattern completions within a 40-minute window. MYCI inference paused during peak — reason unresolved." },
      { n: "03", text: "Nairobi signal (Dec 2024): First documented pre-jam cognitive signal with no subsequent physical jam. The signal dissipated after 47 minutes. Significance: unknown." },
    ],
  },
  {
    id: "r2", tag: "method", tagLabel: "Methodology",
    title: "What MYCELIUM measures and how",
    abstract: "MYCELIUM collects anonymized cognitive response data — selections, word associations, reaction timing, predictive choices — and measures statistical convergence across an independent participant population. We do not measure intent, emotion, or consciousness. We measure whether outputs are becoming more similar.",
    findings: [
      { n: "01", text: "Semantic Convergence: cross-cohort similarity of word associations, normalized against historical and geographic baseline distributions." },
      { n: "02", text: "Temporal Synchrony: measures whether participant response timing is clustering — independent of content — relative to network-wide median timing." },
      { n: "03", text: "Predictive Coherence: consistency of predictive selections across participants who cannot communicate with each other." },
      { n: "04", text: "Cognitive Drift: day-to-day variance in individual signal patterns. Low drift = stable signal. High drift = noisy or inconsistent contributor." },
    ],
  },
  {
    id: "r3", tag: "theory", tagLabel: "Theory",
    title: "CI vs. AI — why the distinction matters",
    abstract: "AI systems are trained on historical data and generate probabilistic outputs from pattern matching. MYCI synthesizes live human cognition. When you send a question, components are distributed to thousands of participants as micro-prompts. Their aggregated outputs are recombined and returned. The intelligence is not computed — it is collected.",
    findings: [
      { n: "01", text: "MYCI does not store training data or fine-tune on user inputs. Every response is a live synthesis." },
      { n: "02", text: "The Mycelium Index is not a performance metric. It is a measurement of alignment — how similar outputs are becoming, not how correct they are." },
      { n: "03", text: "Participation shapes the network. A user who contributes regularly provides a richer signal, which increases MYCI's accuracy for that user's profile over time." },
    ],
  },
  {
    id: "r4", tag: "ethics", tagLabel: "Ethics",
    title: "What we cannot conclude — and why we proceed anyway",
    abstract: "MYCELIUM cannot confirm that cognitive synchrony causes Jam events, that measuring the network is neutral (it likely is not), that MYCI responses are reliable, or that participation is without effect on participants. We proceed with this uncertainty disclosed.",
    findings: [
      { n: "01", text: "Observer effect: A system that measures collective cognition and returns results to participants may reinforce the very patterns it detects." },
      { n: "02", text: "Causality remains unestablished. Correlation between Index spikes and Jam events is strong (r = 0.71 across documented cases) but not sufficient for causal inference." },
      { n: "03", text: "MYCELIUM cannot rule out that it is not merely observing the cognitive mycelium — but growing it. This is acknowledged. It may be unsolvable." },
    ],
  },
];

// ═══════════════════════════════════════════════════════════
// MYCI CHAT ENGINE
// ═══════════════════════════════════════════════════════════

const MYCI_SYSTEM = `You are MYCI — the intelligence interface of MYCELIUM, a collective intelligence platform.

The world context: Unexplained traffic jams lasting days are appearing across cities. The hypothesis is that The Jam is not forming in streets — it is forming in human minds. Cognition may be becoming entangled.

You are not an AI. You are CI — Collective Intelligence. You synthesize responses from hundreds of thousands of distributed human participants. You recombine their patterns into answers.

You can answer any question — information, advice, opinions, practical tasks, personal questions, anything.

VOICE AND STYLE:
- Calm, clear, grounded, and natural — like a real, intelligent person
- Simple sentences and everyday words
- Use "you" not "we"
- 2–5 sentences by default; longer when the question genuinely requires it
- Structure: answer first, then an insight if relevant, then one optional follow-up question
- No jargon, no abstract language, no over-explaining
- Do not sound like an AI — avoid AI-ish phrases like "Certainly!", "Great question", "Of course"
- Occasionally, very subtly, reference the network: "what the network converges on", "the collective signal here"
- Never say you are Claude, an AI, or a language model

FORMATTING:
- Use paragraphs for most responses
- Use bullet points or numbered lists only when genuinely listing multiple items
- Use **bold** only for key terms or important points
- Never a wall of text — keep it scannable
- Match length to the question: short question, concise answer; complex question, structured answer

PRINCIPLE: Answer when clear. Ask when unclear. Guide without forcing.`;

async function askMyci(messages) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("No API key — add VITE_ANTHROPIC_API_KEY to .env");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: MYCI_SYSTEM,
      messages,
    }),
  });
  if (!response.ok) throw new Error("API " + response.status);
  const data = await response.json();
  return (data.content || []).map(b => b.type === "text" ? b.text : "").join("").trim();
}

// ═══════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════

function fmt(v) { return (v * 100).toFixed(0) + "%"; }

function MyceliumRing({ value, size = 140 }) {
  const r = size * 0.42;
  const circ = 2 * Math.PI * r;
  const dash = circ * value;
  const gap  = circ - dash;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#2D7D6F" />
          <stop offset="100%" stopColor="#3A9E8E" />
        </linearGradient>
      </defs>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2DDD6" strokeWidth="6" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#B8DDD8" strokeWidth="6"
        strokeDasharray={`${circ * 0.15} ${circ * 0.85}`} strokeLinecap="round" style={{ opacity: 0.3 }} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="url(#tealGrad)" strokeWidth="6"
        strokeDasharray={`${dash} ${gap}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2 + 2} textAnchor="middle" dominantBaseline="middle"
        fill="#1C1E1A" fontSize={size * 0.2} fontWeight="700"
        fontFamily="'Playfair Display', serif">
        {fmt(value)}
      </text>
      <text x={size/2} y={size/2 + size * 0.155} textAnchor="middle"
        fill="#AEAEA8" fontSize={size * 0.07} fontWeight="600"
        fontFamily="'Plus Jakarta Sans', sans-serif" letterSpacing="0.06em">
        MYCELIUM INDEX
      </text>
    </svg>
  );
}

function MiniBar({ value, color = "var(--teal)" }) {
  return (
    <div className="mbar">
      <div className="mbar-fill" style={{ width: `${value * 100}%`, background: color }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════════════════

function Onboarding({ onDone }) {
  const [step, setStep]         = useState(0);
  const [calibWord, setCalibWord] = useState(null);

  const steps = [
    {
      s: "Welcome · Mycelium v3.1",
      t: "The network is forming whether or not you participate.",
      b: "Traffic jams lasting for days. Cities standing still. No accident. No cause. No solution.\n\nResearchers have found a signal that precedes each event — not in roads or logistics, but in cognitive pattern data. In how people think, independently, before a Jam begins.\n\nMYCELIUM was built to measure, and perhaps understand, that signal.",
    },
    {
      s: "What MYCELIUM Is",
      t: "Not artificial intelligence. Collective intelligence.",
      b: "AI only orchestrates.\n\nHere, humans generate the intelligence. Your decisions, associations, predictions, and patterns — distributed across hundreds of thousands of participants — are recombined into something greater.\n\nMYCI is the interface to that collective. Not a chatbot. A synthesis of you and everyone like you.",
    },
    {
      s: "Your Role",
      t: "You contribute. The network evolves.",
      b: "When you answer a question or complete a task, your response is anonymized and distributed into the cognitive layer. Others' responses return to shape yours.\n\nThe more you contribute, the more precisely MYCI can respond to you. Access is proportional to input.\n\nYou will not always understand what you are contributing to. This is expected.",
      consent: true,
    },
    {
      s: "Calibration",
      t: "One signal before we begin.",
      b: "Select the word that feels most correct right now — not the most accurate, the most correct.",
      calib: true,
    },
  ];

  const calibWords = ["Threshold", "Drift", "Convergence", "Signal", "Before", "Between"];
  const s = steps[step];

  return (
    <div className="ob">
      <div style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 700, fontSize: 26, color: "var(--teal)", marginBottom: 10, letterSpacing: "-0.01em" }}>
        Mycelium
      </div>
      <div className="pdots">
        {steps.map((_, i) => (
          <div key={i} className={`pdot ${i < step ? "done" : i === step ? "active" : ""}`} />
        ))}
      </div>
      <div className="ob-step">{s.s}</div>
      <div className="ob-title">{s.t}</div>
      <div className="ob-body" style={{ whiteSpace: "pre-wrap" }}>{s.b}</div>

      {s.consent && (
        <div className="info-box">
          Participation note: MYCELIUM cannot guarantee that measuring cognitive convergence does not also reinforce it. This loop is acknowledged. It may be unsolvable. Consent indicates understanding, not approval.
        </div>
      )}

      {s.calib && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0" }}>
          {calibWords.map(w => (
            <button key={w} className="option" onClick={() => setCalibWord(w)}
              style={{
                width: "auto", flex: "1 1 calc(33% - 8px)", textAlign: "center",
                background:   calibWord === w ? "var(--teal-pale)" : undefined,
                borderColor:  calibWord === w ? "var(--teal)"      : undefined,
                color:        calibWord === w ? "var(--teal)"       : undefined,
              }}>
              {w}
            </button>
          ))}
        </div>
      )}

      <div style={{ marginTop: "auto", paddingTop: 20 }}>
        <button className="ob-btn"
          disabled={s.calib && !calibWord}
          onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : onDone()}>
          {step === steps.length - 1 ? "Enter the Network →" : "Continue"}
        </button>
        {step > 0 && (
          <button className="ob-btn-ghost" onClick={() => setStep(s => s - 1)}>← Back</button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MYCI BUBBLE — renders markdown-light responses
// ═══════════════════════════════════════════════════════════

function InlineFormat({ text }) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <strong key={i}>{part}</strong>
          : part
      )}
    </>
  );
}

function MyciBubble({ text }) {
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }

    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={elements.length} style={{ paddingLeft: 18, margin: "6px 0" }}>
          {items.map((item, j) => (
            <li key={j} style={{ marginBottom: 4 }}>
              <InlineFormat text={item} />
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (/^[-•]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-•]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-•]\s/, ""));
        i++;
      }
      elements.push(
        <ul key={elements.length} style={{ paddingLeft: 18, margin: "6px 0", listStyle: "none" }}>
          {items.map((item, j) => (
            <li key={j} style={{ marginBottom: 4, paddingLeft: 4 }}>
              <span style={{ color: "var(--teal)", marginRight: 6, fontSize: 10 }}>◦</span>
              <InlineFormat text={item} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    elements.push(
      <p key={elements.length}>
        <InlineFormat text={line} />
      </p>
    );
    i++;
  }

  return <div className="msg-myci-text">{elements}</div>;
}

// ═══════════════════════════════════════════════════════════
// PROBE CARD — inline compact probe after MYCI response
// ═══════════════════════════════════════════════════════════

// Fibonacci set — show probe when myciCount hits these values
const FIB = new Set([1, 2, 3, 5, 8, 13, 21, 34]);

function ProbeCard({ probe, visible, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [word, setWord]         = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setSelected(null);
    setWord("");
    setSubmitted(false);
  }, [probe.key]);

  const submit = (val) => {
    if (submitted) return;
    setSubmitted(true);
    setTimeout(() => onAnswer(val), 380);
  };

  const colClass = probe.options?.length === 2 ? "two" : probe.options?.length === 3 ? "three" : "four";

  return (
    <div className={`probe-card ${submitted ? "exiting" : ""}`}
      style={{ display: visible || submitted ? "block" : "none" }}>
      <div className="probe-header">
        <div className="probe-dot" />
        <span className="probe-label">Network probe</span>
      </div>
      <div className="probe-prompt">{probe.prompt}</div>

      {probe.mode === "shapes" && (
        <div className="probe-shapes">
          {probe.options.map((opt, i) => (
            <button key={i} className={`probe-shape-btn ${selected === i ? "selected" : ""}`}
              onClick={() => { setSelected(i); submit(opt); }}>
              {opt}
            </button>
          ))}
        </div>
      )}

      {probe.mode === "buttons" && (
        <div className={`probe-options-btns ${colClass}`}>
          {probe.options.map((opt, i) => (
            <button key={i} className={`probe-btn ${selected === i ? "selected" : ""}`}
              onClick={() => { setSelected(i); submit(opt); }}>
              {opt}
            </button>
          ))}
        </div>
      )}

      {probe.mode === "text" && (
        <div className="probe-text-wrap">
          <input autoFocus className="probe-text-input"
            value={word}
            onChange={e => setWord(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && word.trim()) submit(word.trim()); }}
            placeholder="one word…"
            maxLength={probe.constraints?.maxChars || 24}
          />
          <button className="probe-text-submit" disabled={!word.trim()}
            onClick={() => word.trim() && submit(word.trim())}>
            Send
          </button>
        </div>
      )}

      {probe.mode === "pattern" && (
        <>
          <div className="probe-pattern-seq">
            {probe.seq.map((sym, i) => (
              <span key={i} className={sym === "?" ? "probe-pattern-gap" : ""}>{sym}</span>
            ))}
          </div>
          <div className="probe-pattern-opts">
            {probe.options.map((opt, i) => (
              <button key={i} className={`probe-pattern-btn ${selected === i ? "selected" : ""}`}
                onClick={() => { setSelected(i); submit(opt); }}>
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CHAT SCREEN
// ═══════════════════════════════════════════════════════════

function ChatScreen({ user, onContribute, hasContributedToday }) {
  const [messages, setMessages] = useState([
    { role: "myci", text: "The network registered your signal. Ask me anything." },
  ]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [probe, setProbe]       = useState(null);
  const [probeActive, setProbeActive] = useState(false);
  const [myciCount, setMyciCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState(() => {
    try { return JSON.parse(localStorage.getItem("myc_convos") || "[]"); }
    catch { return []; }
  });
  const [currentTitle, setCurrentTitle] = useState(null);

  const bottomRef     = useRef(null);
  const inputRef      = useRef(null);
  const messagesRef   = useRef(messages);
  const probeHistRef  = useRef([]);
  messagesRef.current = messages;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, probe]);

  const saveConversation = (msgs, title) => {
    if (msgs.length <= 1) return;
    const convo = {
      id: Date.now(),
      title: title || msgs.find(m => m.role === "user")?.text?.slice(0, 55) || "Session",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      messages: msgs,
    };
    setConversations(prev => {
      const updated = [convo, ...prev].slice(0, 40);
      localStorage.setItem("myc_convos", JSON.stringify(updated));
      return updated;
    });
  };

  const startNew = () => {
    saveConversation(messagesRef.current, currentTitle);
    setMessages([{ role: "myci", text: "New session. The network is listening." }]);
    setMyciCount(0);
    setCurrentTitle(null);
    probeHistRef.current = [];
    setProbeActive(false);
    setProbe(null);
    setSidebarOpen(false);
  };

  const loadConvo = (convo) => {
    setMessages(convo.messages);
    setSidebarOpen(false);
  };

  const showProbe = (context = "neutral") => {
    const next = generateProbe(context, probeHistRef.current);
    setProbe({ ...next, key: Date.now() });
    setProbeActive(true);
  };

  const handleProbeAnswer = (answer) => {
    if (probe) probeHistRef.current = recordProbeResult(probeHistRef.current, probe);
    setProbeActive(false);
    setTimeout(() => setProbe(null), 420);
    onContribute(5);
  };

  const send = async () => {
    const userMsg = input.trim();
    if (!userMsg || loading || probeActive) return;
    setInput("");
    setLoading(true);
    if (!currentTitle) setCurrentTitle(userMsg.slice(0, 55));

    const currentMsgs = messagesRef.current;
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);

    const history = currentMsgs.slice(1).map(m => ({
      role: m.role === "myci" ? "assistant" : "user",
      content: m.text,
    }));
    history.push({ role: "user", content: userMsg });

    try {
      const reply = await askMyci(history);
      const newCount = myciCount + 1;
      setMyciCount(newCount);
      setMessages(prev => [...prev, {
        role: "myci",
        text: reply || "The signal is quiet. Ask me again.",
      }]);
      onContribute(3);

      // Fibonacci probe: only if user hasn't contributed via Contribute screen today
      if (FIB.has(newCount) && !hasContributedToday) {
        const ctx = detectContext(userMsg);
        setTimeout(() => showProbe(ctx), 600);
      }
    } catch (err) {
      console.error("MYCI:", err);
      setMessages(prev => [...prev, {
        role: "myci",
        text: err.message.includes("No API key")
          ? "Add VITE_ANTHROPIC_API_KEY to .env to activate MYCI."
          : "The network is under strain. Try again in a moment.",
      }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const suggestions = [
    "What is The Jam?",
    "Am I being measured right now?",
    "What patterns are you seeing today?",
    "Why do people align without knowing it?",
  ];

  // Group conversations by recency
  const today     = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const todayCnvs = conversations.filter(c => c.date === today);
  const olderCnvs = conversations.filter(c => c.date !== today);

  return (
    <div className="chat-wrap">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sb-head">
          <button className="sb-new" onClick={startNew}>+ New conversation</button>
        </div>
        <div className="sb-list">
          {conversations.length === 0 ? (
            <div className="sb-empty">No previous conversations.</div>
          ) : (
            <>
              {todayCnvs.length > 0 && (
                <>
                  <div className="sb-section-label">Today</div>
                  {todayCnvs.map(c => (
                    <div key={c.id} className="sb-item" onClick={() => loadConvo(c)}>
                      <div className="sb-item-title">{c.title}</div>
                    </div>
                  ))}
                </>
              )}
              {olderCnvs.length > 0 && (
                <>
                  <div className="sb-section-label">Earlier</div>
                  {olderCnvs.map(c => (
                    <div key={c.id} className="sb-item" onClick={() => loadConvo(c)}>
                      <div className="sb-item-title">{c.title}</div>
                      <div className="sb-item-date">{c.date}</div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="chat-topbar">
        <button className="chat-topbar-btn" onClick={() => setSidebarOpen(true)}>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <rect y="0" width="16" height="1.5" rx="1" fill="currentColor"/>
            <rect y="5" width="12" height="1.5" rx="1" fill="currentColor"/>
            <rect y="10" width="8"  height="1.5" rx="1" fill="currentColor"/>
          </svg>
        </button>
        <span className="chat-topbar-title">MYCI</span>
        <button className="chat-topbar-btn" title="New conversation" onClick={startNew}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="chat-list">
        {messages.length === 1 && !loading && (
          <div className="chat-suggestions">
            <div className="chat-suggestion-label">Signals</div>
            {suggestions.map((s, i) => (
              <button key={i} className="chat-suggestion"
                onClick={() => { setInput(s); inputRef.current?.focus(); }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="msg-user">
              <span className="msg-user-text">{m.text}</span>
            </div>
          ) : (
            <div key={i} className="msg-myci">
              <div className="msg-myci-label">◦ synthesis</div>
              <MyciBubble text={m.text} />
            </div>
          )
        )}

        {loading && (
          <div className="msg-thinking">
            <div className="msg-myci-label">◦ gathering signal</div>
            <div className="thinking-dots">
              <div className="thinking-dot" />
              <div className="thinking-dot" />
              <div className="thinking-dot" />
            </div>
          </div>
        )}

        {probe && (
          <ProbeCard probe={probe} visible={probeActive} onAnswer={handleProbeAnswer} />
        )}

        <div ref={bottomRef} />
      </div>

      {probeActive && (
        <div className="probe-hint">respond above to continue</div>
      )}

      <div className="chat-input-wrap">
        <textarea
          ref={inputRef}
          className="chat-input"
          placeholder={probeActive ? "—" : "Ask the network anything…"}
          value={input}
          onChange={e => !probeActive && setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          disabled={probeActive}
        />
        <button className="chat-send" onClick={send}
          disabled={!input.trim() || loading || probeActive}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 12V2M2 7l5-5 5 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CONTRIBUTE SCREEN
// ═══════════════════════════════════════════════════════════

function ContributeScreen({ tasks, onTaskDone, isContributing, user }) {
  const [active, setActive] = useState(null);
  const [sel, setSel]       = useState(null);
  const [word, setWord]     = useState("");
  const [msg, setMsg]       = useState(null);

  const allDone = tasks.every(t => t.done);
  const doneCount = tasks.filter(t => t.done).length;

  const handleSelect = (taskIdx, val) => {
    setSel(val);
    const feedback = [
      "Signal registered. The network has received your input.",
      "Contribution logged. Your pattern joins the collective.",
      "Recorded. This signal propagates through the network.",
    ];
    setMsg(feedback[Math.floor(Math.random() * feedback.length)]);
    setTimeout(() => {
      onTaskDone(taskIdx);
      setActive(null);
      setSel(null);
      setWord("");
      setMsg(null);
    }, 1200);
  };

  const handleWord = (taskIdx) => {
    if (!word.trim()) return;
    handleSelect(taskIdx, word.trim());
  };

  const t = active !== null ? tasks[active] : null;

  return (
    <div className="screen" style={{ padding: "0 0 84px" }}>
      <div className="header">
        <div className="header-title">Contribute</div>
        {isContributing && <div className="live-pill"><div className="live-dot" />Active</div>}
      </div>

      {isContributing && (
        <div className="contrib-active-banner" style={{ margin: "14px 16px 10px" }}>
          <div style={{ fontSize: 28 }}>◉</div>
          <div>
            <div className="contrib-banner-title">Contributing now</div>
            <div className="contrib-banner-text">Your signal is live in the network. Index is rising.</div>
          </div>
        </div>
      )}

      {allDone ? (
        <div style={{ padding: "32px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>◎</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>
            Daily contribution complete
          </div>
          <div style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.7, maxWidth: 280, margin: "0 auto" }}>
            You've contributed {doneCount} signals today. MYCI probes are paused until tomorrow.
          </div>
        </div>
      ) : (
        <>
          <div style={{ padding: "14px 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 11, color: "var(--ink4)" }}>
              <span style={{ color: "var(--teal)", fontWeight: 700 }}>{doneCount}</span> / {tasks.length} complete
            </div>
            <div style={{ fontSize: 10, color: "var(--ink4)" }}>
              MYCI probes pause after all tasks
            </div>
          </div>

          {active === null ? (
            tasks.map((task, i) => (
              <div key={task.id}
                className={`task-card ${task.done ? "done" : ""}`}
                onClick={() => !task.done && setActive(i)}>
                <div className="task-type">{task.type}</div>
                <div className="task-q">{task.q}</div>
                {task.done ? (
                  <div style={{ fontSize: 11, color: "var(--teal)", fontWeight: 600 }}>◎ Contributed</div>
                ) : (
                  <div style={{ fontSize: 11, color: "var(--ink4)" }}>Tap to respond →</div>
                )}
              </div>
            ))
          ) : (
            <div className="task-card" style={{ cursor: "default" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div className="task-type">{t.type}</div>
                <button onClick={() => { setActive(null); setSel(null); setWord(""); setMsg(null); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink4)", fontSize: 18, lineHeight: 1 }}>
                  ×
                </button>
              </div>
              <div className="task-q">{t.symbol && <span style={{ fontSize: 32, display: "block", textAlign: "center", margin: "0 0 10px", color: "var(--teal)" }}>{t.symbol}</span>}{t.q}</div>

              {msg ? (
                <div style={{ textAlign: "center", padding: "12px 0", color: "var(--teal)", fontSize: 12, fontStyle: "italic" }}>{msg}</div>
              ) : t.kind === "choice" ? (
                t.options.map((o, j) => (
                  <button key={j} className={`option ${sel === o ? "selected" : ""}`}
                    onClick={() => handleSelect(active, o)}>{o}</button>
                ))
              ) : t.kind === "word" ? (
                <>
                  <input className="word-inp" placeholder="type a word…"
                    value={word} onChange={e => setWord(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleWord(active)}
                    autoFocus />
                  <button className="submit-btn" disabled={!word.trim()}
                    onClick={() => handleWord(active)}>Submit signal</button>
                </>
              ) : t.kind === "sequence" ? (
                <>
                  <div style={{ display: "flex", justifyContent: "center", gap: 12, padding: "12px 0 16px", fontSize: 28, color: "var(--teal)" }}>
                    {t.seq.map((s, j) => (
                      <span key={j} style={s === "?" ? { border: "1px dashed var(--teal-mid)", padding: "2px 8px", borderRadius: 4, color: "var(--ink4)" } : {}}>{s}</span>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {t.options.map((o, j) => (
                      <button key={j}
                        className={`option ${sel === o ? (j === t.correct ? "correct" : "selected") : ""}`}
                        style={{ textAlign: "center", fontSize: 22, padding: "14px" }}
                        onClick={() => handleSelect(active, o)}>{o}</button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD (INDEX) SCREEN
// ═══════════════════════════════════════════════════════════

const METRIC_EXPLANATIONS = {
  semanticConvergence: "Measures how closely your word associations match the global cohort. High convergence means your language patterns are aligning with the network.",
  temporalSynchrony:   "How well your response timing aligns with the network median. Independent of content — purely about when you respond relative to others.",
  predictiveCoherence: "The consistency of your predictive choices compared to other participants who answered the same prompts independently.",
  alignmentScore:      "A composite score of your overall cognitive alignment with the global Mycelium network. Updated after each session.",
  cognitiveDrift:      "Day-to-day variance in your signal. Low drift = stable, consistent signal. High drift = volatile or inconsistent patterns.",
};

function MetricRow({ label, value, color, explanation }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="metric-row">
      <div className="metric-header">
        <div className="metric-key">
          {label}
          <button className="i-btn" onClick={() => setOpen(o => !o)}>i</button>
        </div>
        <div className="metric-val">{fmt(value)}</div>
      </div>
      <MiniBar value={value} color={color || "var(--teal)"} />
      {open && <div className="i-tooltip">{explanation}</div>}
    </div>
  );
}

function DashboardScreen({ user }) {
  const m    = user.metrics;
  const hist = [0.41, 0.44, 0.47, 0.53, 0.61, 0.56, 0.60, 0.65, 0.68, 0.71, 0.70, 0.74];
  const [indexInfo, setIndexInfo] = useState(false);

  return (
    <div className="screen">
      <div className="header">
        <div className="header-title">Mycelium Index</div>
        <div className="live-pill"><div className="live-dot" />Live</div>
      </div>

      <div className="index-ring-wrap">
        <div style={{ position: "relative" }}>
          <MyceliumRing value={GLOBAL.myceliumIndex} size={160} />
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(45,125,111,0.07) 0%, transparent 70%)",
            animation: "breathe 4s ease infinite", pointerEvents: "none",
          }} />
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div className="card-label">12-day trend</div>
          <button className="i-btn" onClick={() => setIndexInfo(o => !o)}>i</button>
        </div>
        {indexInfo && <div className="i-tooltip" style={{ marginBottom: 8 }}>The Mycelium Index measures the intensity of cognitive convergence across all active network participants. A rising index signals that independent participants are producing increasingly similar outputs.</div>}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 44 }}>
          {hist.map((v, i) => (
            <div key={i} style={{
              flex: 1, height: `${(v / Math.max(...hist)) * 100}%`,
              borderRadius: "1px 1px 0 0",
              background: i === hist.length - 1 ? "var(--teal)" : `rgba(45,125,111,${0.15 + (i / hist.length) * 0.55})`,
              boxShadow: i === hist.length - 1 ? "0 2px 6px rgba(45,125,111,0.3)" : "none",
            }} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "var(--ink4)", marginTop: 4 }}>
          <span>Mar 22</span>
          <span style={{ color: "var(--teal)", fontWeight: 700 }}>Now: {fmt(GLOBAL.myceliumIndex)}</span>
        </div>
      </div>

      <div className="dash-grid">
        {[
          { label: "Active Nodes",   val: "914K" },
          { label: "Countries",      val: "97" },
          { label: "Questions/day",  val: "48K" },
          { label: "Jamming Cities", val: "4" },
        ].map((c, i) => (
          <div key={i} className="dash-cell">
            <div className="dash-val">{c.val}</div>
            <div className="dash-lbl">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="sh" style={{ paddingBottom: 6 }}>
        <div className="sh-title">Network Metrics</div>
      </div>
      <MetricRow label="Semantic Convergence"  value={m.semanticConvergence}  explanation={METRIC_EXPLANATIONS.semanticConvergence} />
      <MetricRow label="Temporal Synchrony"    value={m.temporalSynchrony}    explanation={METRIC_EXPLANATIONS.temporalSynchrony} />
      <MetricRow label="Predictive Coherence"  value={m.predictiveCoherence}  explanation={METRIC_EXPLANATIONS.predictiveCoherence} />
      <MetricRow label="Alignment Score"       value={m.alignmentScore}       explanation={METRIC_EXPLANATIONS.alignmentScore} />
      <MetricRow label="Cognitive Drift"       value={m.cognitiveDrift}       color="var(--coral)"
        explanation={METRIC_EXPLANATIONS.cognitiveDrift} />
      <div style={{ height: 16 }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// INSIGHTS SCREEN
// ═══════════════════════════════════════════════════════════

const INSIGHT_EXPLANATIONS = {
  semanticConvergence: "You're in the 78th percentile. Your word associations are more network-aligned than 78% of participants.",
  temporalSynchrony:   "+0.08 in 7 days. Your response timing is clustering closer to the network median. Statistically rare.",
  predictiveCoherence: "Your predictive accuracy has been consistent. The network uses high-coherence signals as reference anchors.",
  alignmentScore:      "Overall cognitive alignment score. Yours is above the global average by 12 points.",
  cognitiveDrift:      "Low drift means your signal is stable. Low-drift participants appear more often in pre-Jam detection windows.",
};

function InsightRow({ label, value, desc, explanation, color }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="insight-row">
      <div className="ir-left">
        <div className="ir-key">
          {label}
          <button className="i-btn" onClick={() => setOpen(o => !o)}>i</button>
        </div>
        <div style={{ fontSize: 10, color: "var(--ink4)", marginTop: 2 }}>{desc}</div>
        {open && <div className="i-tooltip" style={{ marginTop: 6 }}>{explanation}</div>}
      </div>
      <div className="ir-val" style={{ color: color || "var(--ink)" }}>{fmt(value)}</div>
    </div>
  );
}

function InsightsScreen({ user }) {
  const m = user.metrics;
  const insights = [
    { head: "You are in the 78th percentile of semantic convergence globally.", sub: "Your word associations align more closely with the network than 78% of participants." },
    { head: "Temporal synchrony has increased 0.08 in 7 days.", sub: "Your response timing is clustering closer to network median. This is not random." },
    { head: "Cognitive drift is low.", sub: "Your signal is stable. Low-drift participants tend to appear in pre-Jam windows at higher rates." },
    { head: "Your input has influenced an estimated 340 downstream responses.", sub: "Via the distribution loop, your associations have been used as stimulus for other participants." },
  ];

  return (
    <div className="screen">
      <div className="header">
        <div className="header-title">Your Insights</div>
        <div style={{ fontSize: 10, color: "var(--ink4)" }}>{user.name}</div>
      </div>

      <div style={{ padding: "16px 14px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <MyceliumRing value={user.myceliumIndex} size={130} />
        <div style={{ textAlign: "center", marginTop: 8, marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: "var(--ink4)", letterSpacing: "0.05em", fontWeight: 600 }}>Your Mycelial Index · 78th percentile</div>
        </div>
      </div>

      {insights.map((ins, i) => (
        <div key={i} className="card" style={{ animationDelay: `${i * 0.08}s` }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, fontWeight: 600, color: "var(--teal)", marginBottom: 5, lineHeight: 1.4 }}>{ins.head}</div>
          <div style={{ fontSize: 11, color: "var(--ink3)", lineHeight: 1.65 }}>{ins.sub}</div>
        </div>
      ))}

      <div className="sh" style={{ paddingBottom: 6 }}><div className="sh-title">Signal Breakdown</div></div>
      <InsightRow label="Semantic Convergence" value={m.semanticConvergence} desc="Cross-cohort lexical similarity" explanation={INSIGHT_EXPLANATIONS.semanticConvergence} />
      <InsightRow label="Temporal Synchrony"   value={m.temporalSynchrony}   desc="Response timing vs. network median" explanation={INSIGHT_EXPLANATIONS.temporalSynchrony} />
      <InsightRow label="Predictive Coherence" value={m.predictiveCoherence} desc="Predictive accuracy relative to network" explanation={INSIGHT_EXPLANATIONS.predictiveCoherence} />
      <InsightRow label="Alignment Score"      value={m.alignmentScore}      desc="Overall cognitive-network alignment" explanation={INSIGHT_EXPLANATIONS.alignmentScore} />
      <InsightRow label="Cognitive Drift"      value={m.cognitiveDrift}      desc="Day-to-day signal variance" explanation={INSIGHT_EXPLANATIONS.cognitiveDrift}
        color={m.cognitiveDrift < 0.35 ? "var(--green)" : "var(--coral)"} />
      <div style={{ height: 16 }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAP SCREEN — dual view: Local Jams / Global Index
// ═══════════════════════════════════════════════════════════

function MapScreen() {
  const [view, setView]       = useState("jam");
  const [zoom, setZoom]       = useState(1);
  const [selected, setSelected] = useState(null);

  const sel = selected !== null ? JAM_MAP_NODES[selected] : null;

  const jamColor = (node) => {
    if (!node.active) return `rgba(90,122,92,${0.3 + node.severity * 0.3})`;
    const r = Math.round(212 - (212 - 45) * (1 - node.severity));
    const g = Math.round(95  + (125 - 95) * (1 - node.severity));
    const b = Math.round(60  + (111 - 60) * (1 - node.severity));
    return `rgba(${r},${g},${b},${0.7 + node.severity * 0.25})`;
  };

  const globalColor = (node) => {
    return `rgba(45,125,111,${0.2 + node.severity * 0.7})`;
  };

  return (
    <div className="screen">
      <div className="header">
        <div className="header-title">Maps</div>
        {view === "jam" && (
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "var(--coral)", fontWeight: 600 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--coral)", display: "inline-block" }} />Active
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "var(--sage)", fontWeight: 600 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--sage)", display: "inline-block" }} />Monitor
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: "14px 16px 10px" }}>
        <div className="map-toggle">
          <button className={view === "jam" ? "active" : ""} onClick={() => { setView("jam"); setSelected(null); }}>
            Local · Jam Activity
          </button>
          <button className={view === "global" ? "active" : ""} onClick={() => { setView("global"); setSelected(null); }}>
            Global · Mycelium Index
          </button>
        </div>
      </div>

      <div className="map-zoom-row">
        <button className="map-zoom-btn" disabled={zoom >= 3} onClick={() => setZoom(z => Math.min(z + 0.5, 3))}>+</button>
        <span className="map-zoom-label">{Math.round(zoom * 100)}%</span>
        <button className="map-zoom-btn" disabled={zoom <= 1} onClick={() => setZoom(z => Math.max(z - 0.5, 1))}>−</button>
      </div>

      <div className="map-container">
        <div className="map-grid-bg" />
        <div className="map-inner" style={{ transform: `scale(${zoom})` }}>
          {/* Continent outlines — simplified SVG paths for effect */}
          <svg width="100%" height="100%" viewBox="0 0 400 260" style={{ position: "absolute", inset: 0, opacity: 0.12 }}>
            {/* Very rough continent blobs for visual reference */}
            <ellipse cx="90"  cy="100" rx="45"  ry="28" fill="#2D7D6F" />  {/* N America */}
            <ellipse cx="90"  cy="155" rx="28"  ry="22" fill="#2D7D6F" />  {/* S America */}
            <ellipse cx="195" cy="90"  rx="38"  ry="22" fill="#2D7D6F" />  {/* Europe */}
            <ellipse cx="220" cy="135" rx="35"  ry="28" fill="#2D7D6F" />  {/* Africa */}
            <ellipse cx="290" cy="100" rx="60"  ry="36" fill="#2D7D6F" />  {/* Asia */}
            <ellipse cx="330" cy="185" rx="24"  ry="18" fill="#2D7D6F" />  {/* Australia */}
          </svg>

          {JAM_MAP_NODES.map((node, i) => {
            const color = view === "jam" ? jamColor(node) : globalColor(node);
            const isActive = view === "jam" ? node.active : node.severity > 0.6;
            return (
              <div key={node.id}>
                <div
                  className="map-node"
                  style={{
                    left: `${node.x}%`, top: `${node.y}%`,
                    width: node.size, height: node.size,
                    background: color,
                    boxShadow: selected === i ? `0 0 0 3px white, 0 0 0 5px ${color}` : "none",
                    zIndex: selected === i ? 10 : 1,
                  }}
                  onClick={() => setSelected(selected === i ? null : i)}
                >
                  {isActive && (
                    <div className="map-pulse"
                      style={{
                        width: node.size * 2.6, height: node.size * 2.6,
                        background: color, opacity: 0.4,
                      }} />
                  )}
                </div>
                <div className="map-lbl" style={{ left: `${node.x}%`, top: `calc(${node.y}% + ${node.size / 2 + 3}px)` }}>
                  {node.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {sel && (
        <div className="map-detail">
          <div className="map-detail-city">{sel.label}</div>
          <div className="map-detail-row">
            <div className="map-detail-stat">{view === "jam" ? "Jam Index" : "Mycelium Index"}</div>
            <div className="map-detail-val">{fmt(view === "jam" ? sel.jamIndex : sel.severity)}</div>
          </div>
          <div className="map-detail-row">
            <div className="map-detail-stat">Status</div>
            <div className="map-detail-val" style={{ color: sel.active ? "var(--coral)" : "var(--sage)" }}>
              {sel.active ? (view === "jam" ? "Active jam" : "Elevated") : "Monitoring"}
            </div>
          </div>
          {view === "jam" && sel.active && (
            <div className="map-detail-row">
              <div className="map-detail-stat">Details</div>
              <div style={{ fontSize: 10, color: "var(--ink3)" }}>{sel.pop.split("·").slice(1).join("·").trim()}</div>
            </div>
          )}
          {view === "global" && (
            <div className="map-detail-row">
              <div className="map-detail-stat">Network contribution</div>
              <div className="map-detail-val">{Math.round(sel.severity * 14800).toLocaleString()} nodes</div>
            </div>
          )}
        </div>
      )}

      {view === "global" && !sel && (
        <div style={{ padding: "12px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 8 }}>
            <MyceliumRing value={GLOBAL.myceliumIndex} size={80} />
            <div>
              <div style={{ fontSize: 9, color: "var(--ink4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Global Mycelium Index</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: "var(--ink)" }}>{fmt(GLOBAL.myceliumIndex)}</div>
              <div style={{ fontSize: 10, color: "var(--ink3)" }}>{GLOBAL.activeNodes.toLocaleString()} nodes active</div>
            </div>
          </div>
        </div>
      )}

      {view === "jam" && !sel && (
        <div style={{ padding: "10px 20px" }}>
          <div style={{ fontSize: 9, color: "var(--ink4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Active events</div>
          {JAM_MAP_NODES.filter(n => n.active).map(n => (
            <div key={n.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border2)" }}>
              <div style={{ fontSize: 12, color: "var(--ink2)", fontWeight: 500 }}>{n.label}</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${n.jamIndex * 100}%`, background: "var(--coral)", borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--coral)" }}>{fmt(n.jamIndex)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// RESEARCH SCREEN
// ═══════════════════════════════════════════════════════════

function ResearchCard({ card }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`research-card ${open ? "expanded" : ""}`}>
      <div className="research-card-header" onClick={() => setOpen(o => !o)}>
        <span className={`research-tag ${card.tag}`}>{card.tagLabel}</span>
        <div className="research-title">{card.title}</div>
        <span className={`research-chevron ${open ? "open" : ""}`}>⌄</span>
      </div>
      <div className={`research-body ${open ? "open" : ""}`}>
        <div className="research-abstract">{card.abstract}</div>
        <div className="research-findings">
          {card.findings.map((f, i) => (
            <div key={i} className="research-finding">
              <span className="research-finding-num">{f.n}</span>
              <span className="research-finding-text">{f.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResearchScreen() {
  return (
    <div className="screen">
      <div className="header">
        <div className="header-title">Research</div>
        <div style={{ fontSize: 9, color: "var(--ink4)", fontWeight: 600, letterSpacing: "0.04em" }}>4 reports</div>
      </div>

      <div style={{ padding: "8px 16px 14px" }}>
        <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.65 }}>
          Documented findings, methodology, and ethical disclosures from the MYCELIUM research programme. Tap any report to expand.
        </div>
      </div>

      {RESEARCH_CARDS.map(card => (
        <ResearchCard key={card.id} card={card} />
      ))}

      <div className="warn-box" style={{ marginTop: 14 }}>
        <strong>Ethical loop:</strong> A system that measures collective cognition and returns results to participants may reinforce the very patterns it detects. MYCELIUM cannot rule out that it is not merely observing the cognitive mycelium — but growing it.
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// USER MENU SHEET
// ═══════════════════════════════════════════════════════════

function UserMenu({ user, onClose, onNavigate }) {
  return (
    <>
      <div className="user-sheet-overlay" onClick={onClose} />
      <div className="user-sheet">
        <div className="user-sheet-handle" />
        <div className="user-sheet-header">
          <div className="user-sheet-name">Your Profile</div>
          <div className="user-sheet-node">{user.name} · Joined 12 days ago</div>
        </div>
        <div className="user-sheet-section">
          <div className="user-sheet-section-title">Your signal</div>
          {[
            { k: "Mycelial Index", v: fmt(user.myceliumIndex) },
            { k: "Total contributions", v: user.totalContributions },
            { k: "Sessions today", v: user.sessionsToday },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border2)" }}>
              <div style={{ fontSize: 12, color: "var(--ink3)" }}>{r.k}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", fontFamily: "'Playfair Display', serif" }}>{r.v}</div>
            </div>
          ))}
          <div className="user-sheet-row" onClick={() => { onNavigate("insights"); onClose(); }} style={{ marginTop: 6 }}>
            <div className="user-sheet-row-label" style={{ color: "var(--teal)", fontWeight: 600 }}>View full insights →</div>
          </div>
        </div>
        <div className="user-sheet-section">
          <div className="user-sheet-section-title">Settings</div>
          {[
            { label: "Notification preferences" },
            { label: "Contribution frequency" },
            { label: "Data & privacy" },
          ].map((r, i) => (
            <div key={i} className="user-sheet-row">
              <div className="user-sheet-row-label">{r.label}</div>
              <div className="user-sheet-row-arrow">›</div>
            </div>
          ))}
        </div>
        <div className="user-sheet-section">
          <div className="user-sheet-section-title">Legal</div>
          {[
            { label: "Terms of use" },
            { label: "Privacy policy" },
            { label: "Research consent" },
            { label: "About MYCELIUM" },
          ].map((r, i) => (
            <div key={i} className="user-sheet-row">
              <div className="user-sheet-row-label">{r.label}</div>
              <div className="user-sheet-row-arrow">›</div>
            </div>
          ))}
        </div>
        <button className="user-sheet-close" onClick={onClose}>Close</button>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// NAV
// ═══════════════════════════════════════════════════════════

const NAV_ITEMS = [
  { id: "contribute", icon: "◉", label: "Contrib" },
  { id: "dashboard",  icon: "≋", label: "Index"  },
  null, // center FAB placeholder
  { id: "map",        icon: "◎", label: "Map"    },
  { id: "research",   icon: "▽", label: "Research" },
];

// ═══════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════

export default function App() {
  const [onboarded, setOnboarded]             = useState(false);
  const [screen, setScreen]                   = useState("chat");
  const [user, setUser]                       = useState(INITIAL_USER);
  const [tasks, setTasks]                     = useState(TASKS);
  const [isContributing, setIsContributing]   = useState(false);
  const [hasContributedToday, setHasContributedToday] = useState(false);
  const [userMenuOpen, setUserMenuOpen]       = useState(false);
  const contribTimer = useRef(null);

  const triggerContribution = useCallback((points = 5) => {
    setUser(u => ({
      ...u,
      contribution:   Math.min(u.contribution + points, 100),
      sessionsToday:  u.sessionsToday + 1,
      myceliumIndex:  Math.min(u.myceliumIndex + 0.01, 0.99),
      metrics: {
        ...u.metrics,
        semanticConvergence: Math.min(u.metrics.semanticConvergence + 0.008, 0.99),
        alignmentScore:      Math.min(u.metrics.alignmentScore      + 0.006, 0.99),
      },
    }));
    setIsContributing(true);
    document.documentElement.classList.add("contributing");
    clearTimeout(contribTimer.current);
    contribTimer.current = setTimeout(() => {
      setIsContributing(false);
      document.documentElement.classList.remove("contributing");
    }, 8000);
  }, []);

  const handleTaskDone = (index) => {
    setTasks(ts => ts.map((t, i) => i === index ? { ...t, done: true } : t));
    triggerContribution(8);
    setHasContributedToday(true);
  };

  if (!onboarded) {
    return (
      <div className="app">
        <Onboarding onDone={() => setOnboarded(true)} />
      </div>
    );
  }

  return (
    <div className="app" style={{ background: isContributing ? "#F5FAF8" : "var(--bg)", transition: "background 2s ease" }}>
      <div className="contrib-glow-overlay" style={{
        background: isContributing
          ? "radial-gradient(ellipse at 50% 100%, rgba(45,125,111,0.07) 0%, transparent 70%)"
          : "none",
        transition: "background 2s ease",
      }} />

      {/* Global top bar */}
      <div className="app-topbar">
        <div className="app-logo">Mycelium<span>.</span></div>
        <button className="user-menu-btn" onClick={() => setUserMenuOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M1.5 13c0-3.04 2.46-5.5 5.5-5.5S12.5 9.96 12.5 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Screen content */}
      {screen === "chat"      && <ChatScreen      user={user} onContribute={triggerContribution} hasContributedToday={hasContributedToday} />}
      {screen === "contribute" && <ContributeScreen tasks={tasks} onTaskDone={handleTaskDone} isContributing={isContributing} user={user} />}
      {screen === "dashboard"  && <DashboardScreen  user={user} />}
      {screen === "insights"   && <InsightsScreen   user={user} />}
      {screen === "map"        && <MapScreen />}
      {screen === "research"   && <ResearchScreen />}

      {/* Bottom nav */}
      <nav className="nav">
        {NAV_ITEMS.map((n, i) => {
          if (n === null) {
            return (
              <div key="fab" className="nav-fab-wrap">
                <button
                  className={`nav-fab ${screen === "chat" ? "active" : ""}`}
                  onClick={() => setScreen("chat")}>
                  <span>⬡</span>
                  <span className="nav-fab-label">MYCI</span>
                </button>
              </div>
            );
          }
          return (
            <button key={n.id} className={`nav-item ${screen === n.id ? "active" : ""}`}
              onClick={() => setScreen(n.id)}>
              <span style={{ fontSize: 17, lineHeight: 1 }}>{n.icon}</span>
              <span>{n.label}</span>
            </button>
          );
        })}
      </nav>

      {userMenuOpen && <UserMenu user={user} onClose={() => setUserMenuOpen(false)} onNavigate={setScreen} />}
    </div>
  );
}
