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
  jammingCities:       ["Athens","Istanbul","Dhaka","Seoul","São Paulo","Jakarta","Lagos","Cairo","Mexico City","Karachi"],
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

// Global map nodes — 20 cities, equirectangular projection
// x = (lng+180)/360*100, y = (90-lat)/180*100
const JAM_MAP_NODES = [
  { id: "athens",    label: "Athens",      x: 56.7, y: 28.9, size: 18, severity: 0.91, jamIndex: 0.91, active: true,  pop: "Athens, GR · Index: 91% · Active since 04:17" },
  { id: "istanbul",  label: "Istanbul",    x: 58.1, y: 27.2, size: 15, severity: 0.82, jamIndex: 0.82, active: true,  pop: "Istanbul, TR · Index: 82% · Active since 05:44" },
  { id: "dhaka",     label: "Dhaka",       x: 75.0, y: 36.7, size: 15, severity: 0.86, jamIndex: 0.86, active: true,  pop: "Dhaka, BD · Index: 86% · Active since 03:10" },
  { id: "seoul",     label: "Seoul",       x: 85.3, y: 29.4, size: 16, severity: 0.84, jamIndex: 0.84, active: true,  pop: "Seoul, KR · Index: 84% · Active since 08:03" },
  { id: "saopaulo",  label: "São Paulo",   x: 37.2, y: 62.8, size: 14, severity: 0.77, jamIndex: 0.77, active: true,  pop: "São Paulo, BR · Index: 77% · Active since 14:52" },
  { id: "jakarta",   label: "Jakarta",     x: 79.7, y: 53.3, size: 13, severity: 0.73, jamIndex: 0.73, active: true,  pop: "Jakarta, ID · Index: 73% · Active since 02:30" },
  { id: "lagos",     label: "Lagos",       x: 50.8, y: 46.7, size: 13, severity: 0.71, jamIndex: 0.71, active: true,  pop: "Lagos, NG · Index: 71% · Active since 09:30" },
  { id: "cairo",     label: "Cairo",       x: 58.6, y: 33.3, size: 12, severity: 0.68, jamIndex: 0.68, active: true,  pop: "Cairo, EG · Index: 68% · Active since 06:55" },
  { id: "mexicocity",label: "Mexico City", x: 22.5, y: 39.4, size: 12, severity: 0.65, jamIndex: 0.65, active: true,  pop: "Mexico City, MX · Index: 65% · Active since 13:20" },
  { id: "karachi",   label: "Karachi",     x: 68.6, y: 36.1, size: 11, severity: 0.61, jamIndex: 0.61, active: true,  pop: "Karachi, PK · Index: 61% · Active since 01:45" },
  { id: "tokyo",     label: "Tokyo",       x: 88.9, y: 30.0, size: 11, severity: 0.55, jamIndex: 0.55, active: false, pop: "Tokyo, JP · Index: 55% · Elevated" },
  { id: "mumbai",    label: "Mumbai",      x: 70.3, y: 39.4, size: 10, severity: 0.52, jamIndex: 0.52, active: false, pop: "Mumbai, IN · Index: 52% · Elevated" },
  { id: "losangeles",label: "Los Angeles", x: 17.2, y: 31.1, size: 10, severity: 0.49, jamIndex: 0.49, active: false, pop: "Los Angeles, US · Index: 49% · Elevated" },
  { id: "sydney",    label: "Sydney",      x: 91.9, y: 68.9, size: 9,  severity: 0.47, jamIndex: 0.47, active: false, pop: "Sydney, AU · Index: 47% · Monitoring" },
  { id: "london",    label: "London",      x: 50.0, y: 21.7, size: 9,  severity: 0.44, jamIndex: 0.44, active: false, pop: "London, UK · Index: 44% · Monitoring" },
  { id: "moscow",    label: "Moscow",      x: 60.3, y: 18.9, size: 9,  severity: 0.43, jamIndex: 0.43, active: false, pop: "Moscow, RU · Index: 43% · Monitoring" },
  { id: "berlin",    label: "Berlin ◉",    x: 53.6, y: 21.1, size: 9,  severity: 0.41, jamIndex: 0.41, active: false, pop: "Berlin, DE · Index: 41% · Local · Monitoring" },
  { id: "chicago",   label: "Chicago",     x: 25.8, y: 26.7, size: 8,  severity: 0.38, jamIndex: 0.38, active: false, pop: "Chicago, US · Index: 38% · Monitoring" },
  { id: "buenosaires",label:"Buenos Aires",x: 33.9, y: 68.9, size: 8,  severity: 0.36, jamIndex: 0.36, active: false, pop: "Buenos Aires, AR · Index: 36% · Monitoring" },
  { id: "nairobi",   label: "Nairobi",     x: 60.3, y: 50.6, size: 7,  severity: 0.34, jamIndex: 0.34, active: false, pop: "Nairobi, KE · Index: 34% · Normal" },
];

// Berlin local jam zones
const BERLIN_JAM_ZONES = [
  { id: "kudamm", name: "Ku'damm Corridor",  severity: 0.82, since: "06:14", note: "Charlottenburg · both directions at standstill", active: true  },
  { id: "a100",   name: "A100 Westkreuz",    severity: 0.75, since: "07:45", note: "Schöneberg / Tempelhof · motorway gridlock",     active: true  },
  { id: "alex",   name: "Alexanderplatz",    severity: 0.68, since: "08:30", note: "Mitte · surface streets and plaza blocked",       active: true  },
  { id: "pberg",  name: "Prenzlauer Berg",   severity: 0.44, since: "09:12", note: "Elevated signal · no surface jam yet",            active: false },
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
      model: "claude-haiku-4-5-20251001",
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
// INTRO — cinematic 11-card narrative onboarding
// ═══════════════════════════════════════════════════════════

function Intro({ onDone }) {
  const [step, setStep] = useState(0);
  const [calibWord, setCalibWord] = useState(null);
  const TOTAL = 11;
  const CALIB_WORDS = ["Threshold", "Drift", "Convergence", "Signal", "Before", "Between"];

  const cards = [
    { dark: true,  bg: "var(--ink)",     headline: "We should talk.",                    centered: true },
    { dark: false, bg: "var(--bg)",      eyebrow: "The Jam",          special: "jam_stats" },
    { dark: false, bg: "var(--bg)",      eyebrow: "The Reach",        headline: "It's not just traffic.", special: "places" },
    { dark: false, bg: "var(--bg2)",     eyebrow: "The Mystery",      headline: "No one can explain it.", special: "theories" },
    { dark: false, bg: "var(--surface)", eyebrow: "The Hypothesis",   headline: "The Mycelium Hypothesis", special: "hypothesis" },
    { dark: false, bg: "var(--bg)",      eyebrow: "The Evidence",     headline: "We tested it.", special: "alignment" },
    { dark: false, bg: "var(--surface)", eyebrow: "Why Now",          headline: "Why now?", special: "earthlings" },
    { dark: true,  bg: "var(--ink)",     eyebrow: "The Shift",        headline: "A shift is happening.", special: "ci_shift" },
    { dark: false, bg: "var(--bg)",      eyebrow: "Your Role",        headline: "This is where you come in.", special: "role" },
    { dark: false, bg: "var(--surface)", eyebrow: "The Organization", headline: "MYCELIUM Research Initiative", special: "org" },
    { dark: true,  bg: "var(--ink)",     headline: "Now…\nwe should talk.", special: "calibration" },
  ];

  const card = cards[step];
  const isDark = card.dark;
  const textColor = isDark ? "#F7F5F0" : "var(--ink)";
  const subColor  = isDark ? "rgba(247,245,240,0.55)" : "var(--ink3)";

  const advance = () => {
    if (step < TOTAL - 1) {
      setStep(s => s + 1);
    } else {
      onDone();
    }
  };

  const renderBody = () => {
    switch (card.special) {
      case "jam_stats":
        return (
          <div>
            <p style={{ color: subColor, marginBottom: 20, lineHeight: 1.8 }}>
              Maybe you saw it.<br />
              Maybe you were inside it.
            </p>
            <p style={{ color: subColor, marginBottom: 28, lineHeight: 1.8 }}>
              Sudden slowdowns.<br />
              Everything stopping for no clear reason.
            </p>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 76, fontWeight: 700, color: "var(--teal)", lineHeight: 1, marginBottom: 6 }}>98%</div>
              <div style={{ fontSize: 13, color: subColor, letterSpacing: "0.04em" }}>of people have heard about it</div>
            </div>
            <p style={{ color: subColor, lineHeight: 1.8 }}>Most have already experienced it.</p>
          </div>
        );

      case "places":
        return (
          <div>
            <p style={{ color: subColor, marginBottom: 24, lineHeight: 1.8 }}>
              It happens in cities.<br />
              But also in places where congestion never existed.
            </p>
            <div style={{ paddingLeft: 16, borderLeft: "2px solid var(--coral-mid)", marginBottom: 28 }}>
              {[
                { text: "Sea routes.",   size: 17, color: "var(--coral)",       opacity: 1.0 },
                { text: "Airspaces.",    size: 16, color: "var(--coral-light)", opacity: 0.8 },
                { text: "Rural areas.",  size: 15, color: subColor,             opacity: 0.65 },
              ].map((item, i) => (
                <p key={i} style={{ fontStyle: "italic", color: item.color, fontSize: item.size, marginBottom: 8, opacity: item.opacity }}>{item.text}</p>
              ))}
            </div>
            <p style={{ color: subColor, marginBottom: 12 }}>Places that were always… fine.</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 22, color: textColor }}>Until now.</p>
          </div>
        );

      case "theories": {
        const theories = ["Technology.", "Behavior.", "Environment.", "Beliefs."];
        return (
          <div>
            <p style={{ color: subColor, marginBottom: 16, lineHeight: 1.7 }}>There are theories.</p>
            <div style={{ marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {theories.map((t, i) => (
                <span key={i} style={{ textDecoration: "line-through", textDecorationColor: "var(--gold)", textDecorationThickness: 2, color: "var(--ink3)", fontSize: 15 }}>{t}</span>
              ))}
            </div>
            <p style={{ color: subColor, lineHeight: 1.8, marginBottom: 32 }}>
              Some say it's artificial.<br />
              Some say it's natural.<br />
              Some turned it into ideology.
            </p>
            <div style={{ borderTop: "1px solid var(--bg3)", paddingTop: 24 }}>
              <p style={{ color: subColor, marginBottom: 10 }}>None of them hold.</p>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "var(--gold)" }}>Except one.</p>
            </div>
          </div>
        );
      }

      case "hypothesis":
        return (
          <div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 19, color: subColor, lineHeight: 1.65, marginBottom: 16 }}>
              What if The Jam isn't happening on the streets…
            </p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 22, fontWeight: 600, color: "var(--teal)", lineHeight: 1.5 }}>
              but in our minds?
            </p>
          </div>
        );

      case "alignment":
        return (
          <div>
            <p style={{ color: subColor, lineHeight: 1.8, marginBottom: 20 }}>
              Across thousands of people.<br />
              Across hundreds of places.
            </p>
            <p style={{ color: subColor, marginBottom: 12 }}>And something appeared:</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 700, fontStyle: "italic", color: "var(--teal)", marginBottom: 24, lineHeight: 1 }}>alignment.</p>
            <p style={{ color: subColor, marginBottom: 6, fontSize: 14 }}>We call it:</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, fontWeight: 700, color: textColor, marginBottom: 20 }}>The Mycelium Index</p>
            <p style={{ color: subColor }}>And it correlates with The Jam.</p>
          </div>
        );

      case "earthlings": {
        const lines = [
          { text: "Because we've never been this connected.", indent: 0,  italic: false },
          { text: "We share the same spaces.",                indent: 0,  italic: false },
          { text: "The same data.",                           indent: 12, italic: false },
          { text: "The same signals.",                        indent: 24, italic: false },
          { text: "Through cities, media, systems.",          indent: 0,  italic: false },
          { text: "Despite everything that divides us…",      indent: 0,  italic: true  },
          { text: "something is aligning.",                   indent: 0,  italic: true  },
        ];
        return (
          <div>
            {lines.map((line, i) => (
              <p key={i} style={{ color: subColor, marginBottom: 8, paddingLeft: line.indent, lineHeight: 1.7, fontStyle: line.italic ? "italic" : "normal" }}>{line.text}</p>
            ))}
            <p style={{ marginTop: 20, fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "var(--teal)" }}>
              We are becoming <em>earthlings</em>.
            </p>
          </div>
        );
      }

      case "ci_shift":
        return (
          <div>
            <p style={{ color: subColor, marginBottom: 32, lineHeight: 1.8 }}>
              AI helped us process knowledge.<br />
              But something else is emerging.
            </p>
            <div style={{ marginBottom: 28 }}>
              <p style={{ textDecoration: "line-through", textDecorationColor: "rgba(247,245,240,0.25)", color: "rgba(247,245,240,0.25)", fontSize: 14, letterSpacing: "0.06em", marginBottom: 12 }}>
                AI — Artificial Intelligence
              </p>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: "var(--teal-light)", letterSpacing: "-0.01em" }}>
                CI — Collective Intelligence
              </p>
            </div>
            <p style={{ color: subColor, lineHeight: 2.2, letterSpacing: "0.02em" }}>
              Not artificial.<br />
              Human.
            </p>
          </div>
        );

      case "role":
        return (
          <div>
            <p style={{ color: subColor, marginBottom: 20, lineHeight: 1.8 }}>
              This app is not just a tool.<br />
              It's an interface.
            </p>
            <p style={{ color: subColor, marginBottom: 20, lineHeight: 1.8 }}>
              You ask questions.<br />
              You get answers shaped by many minds.
            </p>
            <p style={{ color: subColor, marginBottom: 16, lineHeight: 1.8 }}>Sometimes, it asks you something small.</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "var(--teal)", fontSize: 22, marginBottom: 20, letterSpacing: "-0.01em" }}>Quick. Simple.</p>
            <p style={{ color: subColor, lineHeight: 1.8 }}>
              That's how we measure alignment.<br />
              That's how we build it.
            </p>
          </div>
        );

      case "org":
        return (
          <div>
            <div style={{ marginBottom: 24 }}>
              {["Non-profit.", "Transparent.", "Globally collaborative."].map((item, i) => (
                <p key={i} style={{ color: "var(--sage)", fontSize: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "var(--teal)", fontSize: 12 }}>✓</span> {item}
                </p>
              ))}
            </div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: "var(--ink)", marginBottom: 24 }}>No ads.</p>
            <p style={{ color: subColor, lineHeight: 1.8, marginBottom: 24 }}>Your data is anonymized from the first moment.</p>
            <div style={{ borderTop: "1px solid var(--bg3)", paddingTop: 20 }}>
              <p style={{ color: subColor, lineHeight: 1.8, marginBottom: 4 }}>You don't have terms and conditions.</p>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>We do.</p>
              <p style={{ color: subColor }}>To serve civilization.</p>
            </div>
          </div>
        );

      case "calibration":
        return (
          <div>
            <p style={{ color: subColor, marginBottom: 24, lineHeight: 1.7, fontSize: 15 }}>
              One signal before we begin.<br />
              Select the word that feels most correct right now —<br />
              not the most accurate, the most correct.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CALIB_WORDS.map(w => (
                <button
                  key={w}
                  onClick={() => setCalibWord(w)}
                  style={{
                    flex: "1 1 calc(33% - 8px)",
                    padding: "11px 8px",
                    border: `1px solid ${calibWord === w ? "var(--teal)" : "rgba(247,245,240,0.18)"}`,
                    borderRadius: 8,
                    background: calibWord === w ? "rgba(45,125,111,0.22)" : "rgba(247,245,240,0.04)",
                    color: calibWord === w ? "var(--teal-light)" : "rgba(247,245,240,0.65)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      minHeight: "100dvh",
      maxWidth: 430,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      padding: "0 28px 40px",
      position: "relative",
      background: card.bg,
      transition: "background 0.5s ease",
    }}>

      {/* Progress bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: isDark ? "rgba(247,245,240,0.08)" : "var(--bg3)" }}>
        <div style={{ height: "100%", background: "var(--teal)", width: `${((step + 1) / TOTAL) * 100}%`, transition: "width 0.4s ease" }} />
      </div>

      {/* Skip — hidden on final card */}
      {step < TOTAL - 1 && (
        <button
          onClick={() => setStep(TOTAL - 1)}
          style={{
            position: "absolute", top: 20, right: 24,
            background: "none", border: "none", padding: 0,
            fontSize: 12, letterSpacing: "0.05em", cursor: "pointer",
            color: isDark ? "rgba(247,245,240,0.3)" : "var(--ink4)",
          }}
        >
          skip →
        </button>
      )}

      {/* Card area */}
      <div
        key={step}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: card.centered ? "center" : "flex-start",
          paddingTop: card.centered ? 0 : 68,
          animation: "fadeUp 0.45s ease both",
        }}
      >
        {card.eyebrow && (
          <div style={{
            fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
            color: isDark ? "rgba(247,245,240,0.3)" : "var(--ink4)",
            marginBottom: 18,
          }}>
            {card.eyebrow}
          </div>
        )}

        {/* Card 2 gets a serif headline built inside renderBody */}
        {card.special === "jam_stats" && (
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(24px, 7vw, 36px)",
            fontWeight: 700, lineHeight: 1.2,
            color: textColor, marginBottom: 28, letterSpacing: "-0.01em",
          }}>
            You've come across<br /><span style={{ color: "var(--coral)", fontStyle: "normal", fontWeight: 800, letterSpacing: "-0.02em" }}>The Jam.</span>
          </h1>
        )}

        {card.headline && !card.special?.startsWith("jam") && (
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: card.centered ? "clamp(32px, 9vw, 52px)" : "clamp(22px, 7vw, 36px)",
            fontWeight: 700, lineHeight: 1.15,
            color: textColor, marginBottom: 28,
            letterSpacing: "-0.01em",
            whiteSpace: "pre-wrap",
            textAlign: card.centered ? "center" : "left",
          }}>
            {card.headline}
          </h1>
        )}

        {renderBody()}
      </div>

      {/* Navigation */}
      <div style={{ paddingTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          className="ob-btn"
          disabled={card.special === "calibration" && !calibWord}
          onClick={advance}
          style={{
            background: isDark ? "rgba(45,125,111,0.9)" : undefined,
            borderColor: isDark ? "transparent" : undefined,
            color: isDark ? "#F7F5F0" : undefined,
          }}
        >
          {step === TOTAL - 1 ? "Enter the Network →" : "Continue"}
        </button>
        {step > 0 && (
          <button
            className="ob-btn-ghost"
            onClick={() => setStep(s => s - 1)}
            style={{
              color: isDark ? "rgba(247,245,240,0.45)" : undefined,
              borderColor: isDark ? "rgba(247,245,240,0.12)" : undefined,
            }}
          >
            ← Back
          </button>
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
          { label: "Jamming Cities", val: "20" },
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

// ═══════════════════════════════════════════════════════════
// BERLIN MAP — stylised SVG street map with jam highlights
// ═══════════════════════════════════════════════════════════

function BerlinMap({ selectedZone, setSelectedZone }) {
  // Center = Brandenburg Gate. Scale: 1px ≈ 65m. Ring radius ~75px.
  const cx = 182, cy = 122;

  // Street segments [x1,y1,x2,y2,weight]
  const streets = [
    // Unter den Linden (E–W through center)
    [cx - 52, cy,      cx + 58, cy,      2.2],
    // Ku'damm (W from Breitscheidplatz)
    [cx - 8,  cy + 3,  cx - 62, cy + 5,  2],
    // Friedrichstraße (N–S)
    [cx + 10, cy - 68, cx + 10, cy + 70, 1.6],
    // Torstraße (horizontal, N of center)
    [cx - 50, cy - 22, cx + 72, cy - 24, 1.2],
    // Karl-Marx-Allee (NE from Alexanderplatz area)
    [cx + 56, cy - 2,  cx + 98, cy - 36, 1.6],
    // Landsberger Allee (further NE)
    [cx + 58, cy - 8,  cx + 105,cy - 42, 1],
    // Schönhauser Allee (NE from Mitte)
    [cx + 14, cy - 18, cx + 62, cy - 58, 1.2],
    // Prenzlauer Allee (N)
    [cx + 20, cy - 10, cx + 65, cy - 60, 1],
    // Potsdamer Str (SW)
    [cx - 4,  cy + 14, cx - 20, cy + 90, 1.6],
    // Mehringdamm (SE)
    [cx + 6,  cy + 18, cx + 32, cy + 88, 1.2],
    // Müllerstraße (N–W)
    [cx - 10, cy - 22, cx - 22, cy - 78, 1.2],
    // Gitschiner Str (SE, Kreuzberg)
    [cx + 2,  cy + 20, cx + 55, cy + 52, 1],
    // Warschauer Str (E ring crosser)
    [cx + 60, cy - 6,  cx + 60, cy + 38, 1.2],
    // Spandauer Damm / Heerstraße (W, faint)
    [cx - 52, cy + 5,  cx - 100,cy + 10, 1],
    // E–W cross street (Oranienburger)
    [cx - 40, cy - 38, cx + 55, cy - 40, 0.8],
    // E–W cross street (Gitschiner lower)
    [cx - 30, cy + 38, cx + 60, cy + 36, 0.8],
  ];

  return (
    <div>
      {/* SVG street map */}
      <svg
        viewBox="0 0 374 238"
        style={{ width: "100%", height: "auto", background: "var(--bg2)", borderRadius: 10, display: "block" }}
      >
        {/* S-Bahn Ringbahn */}
        <ellipse cx={cx} cy={cy} rx={80} ry={65}
          fill="none" stroke="#BEB9B1" strokeWidth="1.8" strokeDasharray="5,3.5" />
        <text x={cx + 82} y={cy - 8} fontSize="6.5" fill="var(--ink4)" textAnchor="start"
          fontFamily="'Plus Jakarta Sans', sans-serif">S-Ring</text>

        {/* Street base */}
        {streets.map(([x1,y1,x2,y2,w], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#D0CBc4" strokeWidth={w} strokeLinecap="round" />
        ))}

        {/* ── JAM: Ku'damm Corridor (coral thick overlay) ── */}
        <line x1={cx - 8} y1={cy + 3} x2={cx - 62} y2={cy + 5}
          stroke="var(--coral)" strokeWidth="6" strokeLinecap="round" opacity="0.55" />
        {/* click target */}
        <rect x={cx - 65} y={cy - 5} width={60} height={14} rx="4" fill="transparent"
          style={{ cursor: "pointer" }}
          onClick={() => setSelectedZone(z => z === "kudamm" ? null : "kudamm")} />

        {/* ── JAM: A100 Westkreuz (arc, west of ring) ── */}
        <path d="M 103,175 Q 88,148 90,120 Q 90,100 100,82"
          fill="none" stroke="var(--coral)" strokeWidth="6" strokeLinecap="round" opacity="0.55" />
        {/* click target */}
        <ellipse cx={93} cy={128} rx={16} ry={42} fill="transparent"
          style={{ cursor: "pointer" }}
          onClick={() => setSelectedZone(z => z === "a100" ? null : "a100")} />

        {/* ── JAM: Alexanderplatz halo ── */}
        <circle cx={cx + 55} cy={cy - 1} r={11} fill="var(--coral)" opacity="0.22" />
        <circle cx={cx + 55} cy={cy - 1} r={6}  fill="var(--coral)" opacity="0.6"
          style={{ cursor: "pointer" }}
          onClick={() => setSelectedZone(z => z === "alex" ? null : "alex")} />
        <circle cx={cx + 55} cy={cy - 1} r={14} fill="none"
          stroke="var(--coral)" strokeWidth="1" opacity="0.35"
          style={{ animation: "ripple 2.2s ease-out infinite" }} />

        {/* ── MONITOR: Prenzlauer Berg (gold segment on Schönhauser Allee) ── */}
        <line x1={cx + 24} y1={cy - 22} x2={cx + 60} y2={cy - 56}
          stroke="var(--gold)" strokeWidth="5" strokeLinecap="round" opacity="0.55" />
        {/* click target */}
        <line x1={cx + 24} y1={cy - 22} x2={cx + 60} y2={cy - 56}
          stroke="transparent" strokeWidth="14" strokeLinecap="round"
          style={{ cursor: "pointer" }}
          onClick={() => setSelectedZone(z => z === "pberg" ? null : "pberg")} />

        {/* District labels */}
        <text x={cx - 36} y={cy + 15} fontSize="7.5" fill="var(--ink3)" textAnchor="middle"
          fontFamily="'Plus Jakarta Sans', sans-serif">Charlottenburg</text>
        <text x={cx + 28} y={cy - 28} fontSize="7.5" fill="var(--ink4)" textAnchor="middle"
          fontFamily="'Plus Jakarta Sans', sans-serif">Mitte</text>
        <text x={cx + 70} y={cy + 42} fontSize="7.5" fill="var(--ink4)" textAnchor="middle"
          fontFamily="'Plus Jakarta Sans', sans-serif">Friedrichshain</text>
        <text x={cx + 52} y={cy - 62} fontSize="7.5" fill="var(--ink4)" textAnchor="middle"
          fontFamily="'Plus Jakarta Sans', sans-serif">Prenzlauer Berg</text>
        <text x={cx + 22} y={cy + 62} fontSize="7.5" fill="var(--ink4)" textAnchor="middle"
          fontFamily="'Plus Jakarta Sans', sans-serif">Kreuzberg</text>
        <text x={cx - 24} y={cy - 68} fontSize="7.5" fill="var(--ink4)" textAnchor="middle"
          fontFamily="'Plus Jakarta Sans', sans-serif">Wedding</text>
        <text x={cx - 80} y={cy + 8} fontSize="7.5" fill="var(--ink4)" textAnchor="middle"
          fontFamily="'Plus Jakarta Sans', sans-serif">Spandau →</text>

        {/* User position — Brandenburg Gate */}
        <circle cx={cx} cy={cy} r={12} fill="none" stroke="var(--teal)" strokeWidth="1" opacity="0.35"
          style={{ animation: "breathe 3s ease infinite" }} />
        <circle cx={cx} cy={cy} r={5} fill="var(--teal)" />
        <text x={cx} y={cy + 20} fontSize="7.5" fill="var(--teal)" textAnchor="middle"
          fontWeight="600" fontFamily="'Plus Jakarta Sans', sans-serif">You · Mitte</text>

        {/* Legend */}
        <g transform="translate(10, 10)">
          <circle cx="5" cy="5" r="4" fill="var(--coral)" opacity="0.7" />
          <text x="12" y="9" fontSize="7" fill="var(--ink3)" fontFamily="'Plus Jakarta Sans', sans-serif">Active jam</text>
          <line x1="1" y1="20" x2="9" y2="20" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" opacity="0.65" />
          <text x="12" y="24" fontSize="7" fill="var(--ink3)" fontFamily="'Plus Jakarta Sans', sans-serif">Monitoring</text>
        </g>
      </svg>

      {/* Zone list */}
      <div style={{ marginTop: 10 }}>
        {BERLIN_JAM_ZONES.map(z => (
          <div key={z.id}
            onClick={() => setSelectedZone(cur => cur === z.id ? null : z.id)}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "7px 8px", borderBottom: "1px solid var(--border2)",
              cursor: "pointer",
              background: selectedZone === z.id ? "var(--teal-pale)" : "transparent",
              borderRadius: 4,
            }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--ink2)", fontWeight: 500 }}>{z.name}</div>
              <div style={{ fontSize: 10, color: "var(--ink4)" }}>since {z.since}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${z.severity * 100}%`, background: z.active ? "var(--coral)" : "var(--gold)", borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: z.active ? "var(--coral)" : "var(--gold)", minWidth: 28 }}>
                {Math.round(z.severity * 100)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MapScreen() {
  const [view, setView]             = useState("jam");
  const [zoom, setZoom]             = useState(1);
  const [selected, setSelected]     = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);

  const sel = selected !== null ? JAM_MAP_NODES[selected] : null;
  const selZone = selectedZone ? BERLIN_JAM_ZONES.find(z => z.id === selectedZone) : null;

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
          <button className={view === "jam" ? "active" : ""} onClick={() => { setView("jam"); setSelected(null); setSelectedZone(null); }}>
            Local · Berlin
          </button>
          <button className={view === "global" ? "active" : ""} onClick={() => { setView("global"); setSelected(null); setSelectedZone(null); }}>
            Global · Mycelium Index
          </button>
        </div>
      </div>

      {/* ── LOCAL: Berlin street map ── */}
      {view === "jam" && (
        <div style={{ padding: "0 16px" }}>
          <div style={{ fontSize: 10, color: "var(--ink4)", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
            <span>Berlin · Local Jam Activity</span>
            <span>Updated 2 min ago</span>
          </div>
          <BerlinMap selectedZone={selectedZone} setSelectedZone={setSelectedZone} />
          {selZone && (
            <div className="map-detail" style={{ marginTop: 12 }}>
              <div className="map-detail-city">{selZone.name}</div>
              <div className="map-detail-row">
                <div className="map-detail-stat">Jam Index</div>
                <div className="map-detail-val">{fmt(selZone.severity)}</div>
              </div>
              <div className="map-detail-row">
                <div className="map-detail-stat">Status</div>
                <div className="map-detail-val" style={{ color: selZone.active ? "var(--coral)" : "var(--gold)" }}>
                  {selZone.active ? "Active jam" : "Elevated monitoring"}
                </div>
              </div>
              <div className="map-detail-row">
                <div className="map-detail-stat">Details</div>
                <div style={{ fontSize: 10, color: "var(--ink3)" }}>{selZone.note}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── GLOBAL: world map with 20 city nodes ── */}
      {view === "global" && (
        <>
          <div className="map-zoom-row">
            <button className="map-zoom-btn" disabled={zoom >= 3} onClick={() => setZoom(z => Math.min(z + 0.5, 3))}>+</button>
            <span className="map-zoom-label">{Math.round(zoom * 100)}%</span>
            <button className="map-zoom-btn" disabled={zoom <= 1} onClick={() => setZoom(z => Math.max(z - 0.5, 1))}>−</button>
          </div>
          <div className="map-container">
            <div className="map-grid-bg" />
            <div className="map-inner" style={{ transform: `scale(${zoom})` }}>
              {/* Continent outlines — equirectangular polygons */}
              <svg width="100%" height="100%" viewBox="0 0 400 260" style={{ position: "absolute", inset: 0, opacity: 0.18 }}>
                {/* North America */}
                <polygon fill="#2D7D6F" points="
                  2,32  38,18  82,12  128,15  158,28  162,46
                  138,72 122,90 108,110 108,122
                  82,115  70,100  58,75  45,58  10,44" />
                {/* South America */}
                <polygon fill="#2D7D6F" points="
                  108,122 162,128 165,155 152,172 144,188
                  132,195 125,212 110,190  98,155  92,132" />
                {/* Europe */}
                <polygon fill="#2D7D6F" points="
                  168,68  174,55  182,48  192,38  202,24
                  220,26  218,40  224,52  222,62  215,72
                  205,74  178,72" />
                {/* Africa */}
                <polygon fill="#2D7D6F" points="
                  178,72  202,66  218,68  232,72  244,98
                  246,118  240,130  234,146  228,168  220,194
                  212,200  200,192  192,162  188,130  170,106  172,76" />
                {/* Asia (mainland) */}
                <polygon fill="#2D7D6F" points="
                  222,62  230,55  250,42  272,28  308,18
                  350,18  385,22  396,45  388,65  362,72
                  342,72  328,82  318,108  310,124  280,128
                  266,100  258,104  248,98  238,84  222,68" />
                {/* SE Asia / Indonesia hint */}
                <ellipse cx="318" cy="138" rx="18" ry="10" fill="#2D7D6F" />
                {/* Australia */}
                <polygon fill="#2D7D6F" points="
                  308,150  330,140  356,148  370,160
                  366,185  350,200  312,198  304,175" />
              </svg>

              {JAM_MAP_NODES.map((node, i) => {
                const color = globalColor(node);
                const isActive = node.severity > 0.6;
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
                        border: node.id === "berlin" ? "1.5px solid var(--teal)" : "none",
                      }}
                      onClick={() => setSelected(selected === i ? null : i)}
                    >
                      {isActive && (
                        <div className="map-pulse" style={{ width: node.size * 2.6, height: node.size * 2.6, background: color, opacity: 0.4 }} />
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
        </>
      )}

      {/* Global view detail panel */}
      {view === "global" && sel && (
        <div className="map-detail">
          <div className="map-detail-city">{sel.label}</div>
          <div className="map-detail-row">
            <div className="map-detail-stat">Mycelium Index</div>
            <div className="map-detail-val">{fmt(sel.severity)}</div>
          </div>
          <div className="map-detail-row">
            <div className="map-detail-stat">Status</div>
            <div className="map-detail-val" style={{ color: sel.active ? "var(--coral)" : "var(--sage)" }}>
              {sel.active ? "Active jam" : "Monitoring"}
            </div>
          </div>
          <div className="map-detail-row">
            <div className="map-detail-stat">Network contribution</div>
            <div className="map-detail-val">{Math.round(sel.severity * 14800).toLocaleString()} nodes</div>
          </div>
          {sel.active && (
            <div className="map-detail-row">
              <div className="map-detail-stat">Details</div>
              <div style={{ fontSize: 10, color: "var(--ink3)" }}>{sel.pop.split("·").slice(1).join("·").trim()}</div>
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
              <div style={{ fontSize: 10, color: "var(--ink3)" }}>{GLOBAL.activeNodes.toLocaleString()} nodes active · {JAM_MAP_NODES.filter(n => n.active).length} cities jamming</div>
            </div>
          </div>
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
  const [introDone, setIntroDone]              = useState(false);
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

  if (!introDone) {
    return (
      <div className="app">
        <Intro onDone={() => setIntroDone(true)} />
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
