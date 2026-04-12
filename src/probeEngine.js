// ═══════════════════════════════════════════════════════════
// MYCELIUM PROBE ENGINE
// Generates varied, non-repeating cognitive micro-probes.
// Uses weighted randomization, cooldowns, and session memory
// to keep every session feeling fresh.
// ═══════════════════════════════════════════════════════════

// ── SYMBOL POOLS ──────────────────────────────────────────

const SYMBOL_SETS = [
  ["●", "▲", "■", "◇"],
  ["○", "△", "⬡", "□"],
  ["◎", "≋", "△", "▽"],
  ["◆", "□", "○", "⬢"],
  ["◉", "⬡", "≋", "▽"],
  ["◎", "▲", "◇", "⬢"],
  ["●", "○", "⬡", "▽"],
  ["■", "△", "◎", "◆"],
  ["◇", "⬢", "◉", "≋"],
  ["△", "□", "◆", "◎"],
];

// ── SEQUENCES FOR PATTERN COMPLETION ─────────────────────

const SEQUENCES = [
  { seq: ["△", "◎", "▽", "?"], options: ["◉", "⬡", "△", "□"], correct: 0 },
  { seq: ["○", "●", "○", "?"], options: ["●", "○", "◎", "◆"], correct: 0 },
  { seq: ["□", "■", "□", "?"], options: ["■", "□", "▽", "△"], correct: 0 },
  { seq: ["△", "△", "◎", "?"], options: ["△", "◎", "□", "◆"], correct: 1 },
  { seq: ["◆", "◇", "◆", "?"], options: ["◇", "◆", "○", "△"], correct: 0 },
  { seq: ["⬡", "○", "⬡", "?"], options: ["○", "⬡", "△", "■"], correct: 0 },
  { seq: ["▽", "△", "▽", "?"], options: ["△", "▽", "◎", "◆"], correct: 0 },
  { seq: ["◎", "◉", "◎", "?"], options: ["◉", "◎", "△", "□"], correct: 0 },
  { seq: ["≋", "□", "≋", "?"], options: ["□", "≋", "◆", "○"], correct: 0 },
  { seq: ["◇", "◆", "◇", "?"], options: ["◆", "◇", "⬡", "△"], correct: 0 },
];

// ── PROBE FAMILIES ────────────────────────────────────────

const FAMILIES = {

  instant_choice: {
    baseWeight: 20,
    templates: [
      { stem: "left_right",     prompt: "If you had to move now —",               options: ["Left", "Right"] },
      { stem: "stay_move",      prompt: "Right now your instinct says —",          options: ["Stay", "Move"] },
      { stem: "continue_stop",  prompt: "This feels like a moment to —",           options: ["Continue", "Stop"] },
      { stem: "open_close",     prompt: "Something shifts. You —",                 options: ["Open", "Close"] },
      { stem: "act_wait_ask",   prompt: "A decision is required. You —",           options: ["Act", "Wait", "Ask", "Ignore"] },
      { stem: "forward_back",   prompt: "The direction that feels right now is —", options: ["Forward", "Back", "Stay", "Around"] },
      { stem: "rise_fall",      prompt: "This moment feels like it is —",          options: ["Rising", "Falling", "Still", "Turning"] },
      { stem: "gather_release", prompt: "Your impulse right now is to —",          options: ["Gather", "Release", "Hold", "Let go"] },
      { stem: "trust_doubt",    prompt: "You encounter something uncertain. You —",options: ["Trust", "Doubt", "Wait", "Act"] },
      { stem: "begin_end",      prompt: "This feels more like —",                  options: ["A beginning", "An ending", "A middle", "A pause"] },
      { stem: "toward_away",    prompt: "Right now you are more —",                options: ["Moving toward", "Moving away", "Standing still", "Circling back"] },
      { stem: "speak_listen",   prompt: "What feels more right in this moment —",  options: ["Speak", "Listen", "Wait", "Move"] },
      { stem: "inside_outside", prompt: "The feeling is more —",                   options: ["Inside", "Outside", "Between", "Nowhere"] },
      { stem: "alone_together", prompt: "This moment feels more —",                options: ["Alone", "Together", "Apart", "Merged"] },
    ],
    mode: "buttons",
  },

  symbol_perception: {
    baseWeight: 18,
    templates: [
      { stem: "heavier",       promptFn: () => "Which feels heavier?" },
      { stem: "more_stable",   promptFn: () => "Which feels more stable?" },
      { stem: "not_belong",    promptFn: () => "Which one does not belong?" },
      { stem: "move_toward",   promptFn: () => "Which would you move toward?" },
      { stem: "unfinished",    promptFn: () => "Which feels unfinished?" },
      { stem: "further_away",  promptFn: () => "Which is furthest from the others?" },
      { stem: "oldest",        promptFn: () => "Which feels oldest?" },
      { stem: "next_in_seq",   promptFn: () => "Which comes next?" },
      { stem: "loudest",       promptFn: () => "Which is loudest without sound?" },
      { stem: "at_center",     promptFn: () => "Which belongs at the center?" },
      { stem: "expanding",     promptFn: () => "Which is still expanding?" },
      { stem: "almost_done",   promptFn: () => "Which is almost complete?" },
      { stem: "most_distant",  promptFn: () => "Which is the most distant?" },
      { stem: "pulls_you",     promptFn: () => "Which pulls you without a reason?" },
      { stem: "most_recent",   promptFn: () => "Which arrived most recently?" },
    ],
    mode: "shapes",
  },

  mood_state: {
    baseWeight: 15,
    templates: [
      {
        stem: "this_moment", prompt: "This moment feels more like —",
        optionSets: [
          ["Open", "Closed", "Tense", "Quiet"],
          ["Before", "After", "Between", "Still"],
          ["Clear", "Blurred", "Waiting", "Moving"],
          ["Early", "Late", "Neutral", "Suspended"],
          ["Sharp", "Soft", "Distant", "Near"],
        ],
      },
      {
        stem: "right_now", prompt: "Right now is closer to —",
        optionSets: [
          ["Gathering", "Dispersing", "Holding", "Shifting"],
          ["Light", "Heavy", "Even", "Uneven"],
          ["Beginning", "Middle", "End", "Pause"],
          ["Fast", "Slow", "Still", "Reversing"],
        ],
      },
      {
        stem: "today_feels", prompt: "Today feels more —",
        optionSets: [
          ["Compressed", "Expanded", "Familiar", "Strange"],
          ["Focused", "Scattered", "Whole", "Partial"],
          ["Dense", "Empty", "Layered", "Flat"],
        ],
      },
      {
        stem: "this_is_more", prompt: "This is more —",
        optionSets: [
          ["Signal", "Noise", "Pattern", "Chance"],
          ["Surface", "Depth", "Edge", "Center"],
          ["Absence", "Presence", "Waiting", "Passing"],
          ["Question", "Answer", "Space", "Pause"],
        ],
      },
      {
        stem: "feels_like_arrival", prompt: "This feels like —",
        optionSets: [
          ["Something arriving", "Something leaving", "Something staying", "Something changing"],
          ["A breath in", "A breath out", "Held", "Released"],
          ["An opening", "A closing", "An edge", "A center"],
        ],
      },
      {
        stem: "the_air", prompt: "The quality of this moment is —",
        optionSets: [
          ["Charged", "Quiet", "Thick", "Thin"],
          ["Taut", "Loose", "Even", "Shifting"],
        ],
      },
    ],
    mode: "buttons",
  },

  direction_motion: {
    baseWeight: 15,
    templates: [
      { stem: "if_move_now",    prompt: "If you had to move now —",          options: ["Forward", "Back", "Stay", "Sideways"] },
      { stem: "moving_toward",  prompt: "This is moving toward —",           options: ["Resolution", "Uncertainty", "Stillness", "Change"] },
      { stem: "next_step_feel", prompt: "The next step feels like —",        options: ["Expand", "Reduce", "Hold", "Shift"] },
      { stem: "which_way",      prompt: "Which way is clearer right now —",  options: ["Near", "Far", "Pause", "Return"] },
      { stem: "impulse_now",    prompt: "Your immediate impulse is to —",    options: ["Reach", "Pull back", "Stay put", "Circle"] },
      { stem: "motion_type",    prompt: "The motion you feel now is —",      options: ["Straight", "Circular", "Stopped", "Reversing"] },
      { stem: "speed_now",      prompt: "Your sense of speed right now is —",options: ["Accelerating", "Slowing", "Even", "Stopping"] },
      { stem: "drift",          prompt: "You are drifting —",                options: ["Toward something", "Away from something", "In place", "Between things"] },
      { stem: "weight",         prompt: "The weight right now is —",         options: ["Pulling down", "Lifting up", "Balanced", "Shifting"] },
    ],
    mode: "buttons",
  },

  micro_scenario: {
    baseWeight: 14,
    templates: [
      {
        stem: "about_to_happen", prompt: "Something is about to happen. You —",
        optionSets: [
          ["Prepare", "Wait", "Ask", "Ignore"],
          ["Move toward it", "Step back", "Signal others", "Stay still"],
          ["Name it", "Watch it", "Avoid it", "Accept it"],
        ],
      },
      {
        stem: "choose_now", prompt: "You need to choose now. You —",
        optionSets: [
          ["Choose quickly", "Ask for more time", "Flip a coin", "Choose nothing"],
          ["Go with instinct", "Think it through", "Wait for others", "Change the question"],
        ],
      },
      {
        stem: "notice_shift", prompt: "You notice a shift. You —",
        optionSets: [
          ["Name it", "Watch it", "Adjust to it", "Continue anyway"],
          ["Move", "Observe", "Stop", "Signal"],
          ["Lean in", "Step back", "Hold position", "Follow it"],
        ],
      },
      {
        stem: "room_changes", prompt: "The room changes. You —",
        optionSets: [
          ["Stay", "Follow", "Interrupt", "Leave"],
          ["Adapt", "Resist", "Wait", "Lead"],
        ],
      },
      {
        stem: "signal_arrives", prompt: "A signal arrives early. You —",
        optionSets: [
          ["Act on it", "Verify it", "Share it", "Wait for more"],
          ["Trust it", "Question it", "Ignore it", "Pass it on"],
        ],
      },
      {
        stem: "obstacle", prompt: "Something blocks the path. You —",
        optionSets: [
          ["Go around", "Go through", "Go back", "Stop and wait"],
          ["Remove it", "Accept it", "Signal it", "Ignore it"],
        ],
      },
      {
        stem: "two_paths", prompt: "Two paths appear. One is familiar. You —",
        optionSets: [
          ["Take the familiar", "Take the unknown", "Look for a third", "Stay where you are"],
          ["Mark the familiar", "Note the unknown", "Stand between them", "Turn back"],
        ],
      },
      {
        stem: "someone_asks", prompt: "Someone asks for your read on this. You —",
        optionSets: [
          ["Give it honestly", "Give it carefully", "Ask what they think first", "Say nothing yet"],
        ],
      },
    ],
    mode: "buttons",
  },

  single_word: {
    baseWeight: 8,
    templates: [
      { stem: "word_for_moment",   prompt: "One word for this moment." },
      { stem: "before_silence",    prompt: "What comes before silence?" },
      { stem: "next_is",           prompt: "Complete this: next is —" },
      { stem: "word_fits_here",    prompt: "One word that fits here." },
      { stem: "word_for_waking",   prompt: "One word for what you felt when you woke." },
      { stem: "world_feels",       prompt: "Complete this: right now the world feels —" },
      { stem: "word_network",      prompt: "One word the network keeps returning to. Yours is —" },
      { stem: "before_decision",   prompt: "The word just before a decision is —" },
      { stem: "word_for_this",     prompt: "A word for what this is." },
      { stem: "word_for_today",    prompt: "One word that describes today so far." },
      { stem: "word_after",        prompt: "The word that comes after this." },
      { stem: "word_center",       prompt: "What word is at the center of this moment?" },
      { stem: "word_you_avoid",    prompt: "A word you have been avoiding today." },
      { stem: "word_returns",      prompt: "A word that keeps returning." },
      { stem: "word_for_now",      prompt: "Now, in one word." },
    ],
    mode: "text",
    constraints: { maxWords: 3, maxChars: 24 },
  },

  pattern_completion: {
    baseWeight: 10,
    templates: [
      { stem: "fits_next",         promptFn: () => "Which fits next?" },
      { stem: "completes_set",     promptFn: () => "Which completes this set?" },
      { stem: "nearest_cont",      promptFn: () => "Which is the nearest continuation?" },
      { stem: "missing_form",      promptFn: () => "Pick the missing form." },
      { stem: "belongs_in_gap",    promptFn: () => "Which belongs in the gap?" },
      { stem: "would_come_before", promptFn: () => "Which would come just before?" },
    ],
    mode: "pattern",
  },

};

// ── WEIGHTED RANDOM ────────────────────────────────────────

function pickWeighted(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// ── SIMILARITY CHECK ───────────────────────────────────────

function isTooSimilar(probe, recentHistory) {
  for (const recent of recentHistory) {
    if (recent.family === probe.family && recent.promptStem === probe.promptStem) return true;
    if (recent.optionsKey && probe.optionsKey && recent.optionsKey === probe.optionsKey) return true;
    if (recent.mode === "text" && probe.mode === "text" && recent.promptStem === probe.promptStem) return true;
  }
  return false;
}

// ── CONTEXT WEIGHTS ────────────────────────────────────────

function getContextWeights(context) {
  const base = {};
  for (const [k, v] of Object.entries(FAMILIES)) base[k] = v.baseWeight;

  if (context === "decision") {
    base.direction_motion  += 8;
    base.micro_scenario    += 8;
    base.instant_choice    += 5;
  } else if (context === "emotion") {
    base.mood_state        += 10;
    base.single_word       += 6;
  } else if (context === "uncertainty") {
    base.mood_state        += 6;
    base.micro_scenario    += 6;
    base.single_word       += 4;
  } else if (context === "factual") {
    base.symbol_perception += 8;
    base.pattern_completion+= 6;
  }

  return base;
}

// ── RECENCY PENALTY ────────────────────────────────────────

function applyRecencyPenalties(weights, recentHistory) {
  const result = { ...weights };
  const familyCounts = {};
  for (const recent of recentHistory.slice(0, 5)) {
    familyCounts[recent.family] = (familyCounts[recent.family] || 0) + 1;
  }
  for (const [family, count] of Object.entries(familyCounts)) {
    if (result[family]) result[family] = Math.max(1, result[family] - count * 7);
  }
  return result;
}

// ── ID GENERATOR ───────────────────────────────────────────

let _counter = 0;
function genId() {
  return `probe_${Date.now()}_${++_counter}`;
}

// ── MAIN GENERATOR ────────────────────────────────────────

export function generateProbe(context = "neutral", recentHistory = []) {
  const baseWeights = getContextWeights(context);
  const weights = applyRecencyPenalties(baseWeights, recentHistory);

  const familyNames = Object.keys(FAMILIES);
  const familyWeights = familyNames.map(f => weights[f] || 10);

  for (let attempt = 0; attempt < 10; attempt++) {
    const familyName = pickWeighted(familyNames, familyWeights);
    const family = FAMILIES[familyName];

    // Weight templates by recency
    const recentStems = new Set(recentHistory.slice(0, 10).map(r => r.promptStem));
    const templateWeights = family.templates.map(t => recentStems.has(t.stem) ? 1 : 10);
    const template = pickWeighted(family.templates, templateWeights);

    let probe = null;

    // ── symbol_perception ───────────────────────────────
    if (familyName === "symbol_perception") {
      const usedKeys = new Set(recentHistory.slice(0, 6).map(r => r.optionsKey));
      const available = SYMBOL_SETS
        .map((s, i) => ({ s, key: `sym_${i}` }))
        .filter(({ key }) => !usedKeys.has(key));
      const pool = available.length > 0 ? available : SYMBOL_SETS.map((s, i) => ({ s, key: `sym_${i}` }));
      const picked = pool[Math.floor(Math.random() * pool.length)];

      probe = {
        id: genId(), family: familyName, mode: "shapes",
        prompt: template.promptFn(),
        options: picked.s,
        promptStem: template.stem, optionsKey: picked.key,
        meta: { estimatedDurationMs: 1200, contextWeight: context },
      };

    // ── mood_state / micro_scenario ──────────────────────
    } else if (familyName === "mood_state" || familyName === "micro_scenario") {
      const usedKeys = new Set(recentHistory.slice(0, 6).map(r => r.optionsKey));
      let setIdx = template.optionSets.findIndex((_, i) => !usedKeys.has(`${template.stem}_${i}`));
      if (setIdx < 0) setIdx = Math.floor(Math.random() * template.optionSets.length);
      const options = template.optionSets[setIdx];
      const optionsKey = `${template.stem}_${setIdx}`;

      probe = {
        id: genId(), family: familyName, mode: "buttons",
        prompt: template.prompt,
        options,
        promptStem: template.stem, optionsKey,
        meta: { estimatedDurationMs: 1400, contextWeight: context },
      };

    // ── instant_choice / direction_motion ───────────────
    } else if (familyName === "instant_choice" || familyName === "direction_motion") {
      probe = {
        id: genId(), family: familyName, mode: "buttons",
        prompt: template.prompt,
        options: template.options,
        promptStem: template.stem, optionsKey: template.stem,
        meta: { estimatedDurationMs: 1000, contextWeight: context },
      };

    // ── single_word ─────────────────────────────────────
    } else if (familyName === "single_word") {
      probe = {
        id: genId(), family: familyName, mode: "text",
        prompt: template.prompt,
        promptStem: template.stem, optionsKey: template.stem,
        constraints: family.constraints,
        meta: { estimatedDurationMs: 1800, contextWeight: context },
      };

    // ── pattern_completion ───────────────────────────────
    } else if (familyName === "pattern_completion") {
      const seqData = SEQUENCES[Math.floor(Math.random() * SEQUENCES.length)];
      probe = {
        id: genId(), family: familyName, mode: "pattern",
        prompt: template.promptFn(),
        seq: seqData.seq,
        options: seqData.options,
        correct: seqData.correct,
        promptStem: template.stem, optionsKey: `${template.stem}_${seqData.seq.join("")}`,
        meta: { estimatedDurationMs: 1500, contextWeight: context },
      };
    }

    if (probe && !isTooSimilar(probe, recentHistory)) return probe;
  }

  // Fallback
  return {
    id: genId(), family: "instant_choice", mode: "buttons",
    prompt: "Your instinct right now —",
    options: ["Move", "Wait", "Ask", "Stay"],
    promptStem: "fallback", optionsKey: "fallback",
    meta: { estimatedDurationMs: 1000, contextWeight: "neutral" },
  };
}

// ── RECORD RESULT ─────────────────────────────────────────

export function recordProbeResult(recentHistory, probe) {
  const entry = {
    family: probe.family,
    promptStem: probe.promptStem,
    optionsKey: probe.optionsKey,
    mode: probe.mode,
  };
  return [entry, ...recentHistory].slice(0, 15);
}

// ── DETECT CONTEXT FROM CHAT TEXT ────────────────────────

export function detectContext(text) {
  const t = text.toLowerCase();
  if (/decide|choice|choose|option|should i|which|between|or\?/.test(t)) return "decision";
  if (/feel|emotion|anxious|stressed|worried|sad|happy/.test(t))          return "emotion";
  if (/not sure|don't know|unclear|confused|maybe|perhaps|unsure/.test(t)) return "uncertainty";
  if (/what is|how does|explain|define|fact|data|number|percent/.test(t)) return "factual";
  return "neutral";
}
