# MYCELIUM

> A collective intelligence app that lets humans query a distributed network of minds — and quietly measures whether our thoughts are converging before cities grind to a halt.

## Author & course

- **Author:** Ömer Faruk Aslan
- **Studio:** Prompt City — Urban Vision Wolfsburg 2026
- **Course:** IUDD Master, SoSe 2026
- **Chair:** Informatics in Architecture and Urbanism (InfAU), Faculty of Architecture and Urbanism, Bauhaus-Universität Weimar
- **Teaching staff:** Reinhard König, Martin Bielik, Sven Schneider, Egor Gaydukov, Egor Gavrilov
- **Exercise:** Urban Absurdities (Nonsense Project)
- **Submission date:** 2026-04-16

## Links

- **Live app (GitHub Pages):** https://ofa5406.github.io/mycelium/
- **Source repo:** https://github.com/ofa5406/mycelium
- **Miro — thought process & documentation:** https://miro.com/app/board/uXjVGlJBEa8=/
- **Miro — project frame & showreel:** https://miro.com/app/board/uXjVGCtKivA=/?moveToWidget=3458764667722710400&cot=14
- **4m showreel:** embedded on the Miro frame above

## The task

*Nonsense Project* is a two-weeks long task designed to get familiar with the application of coding agents in building apps, tools and projects that investigate unique ways of working with urban context. I was randomly assigned **one urban paradox** and **one constraint** from the studio's *Nonsense Ideas* deck and built a working web app that answers this combination. The process is documented here and in a 60-second showreel.

## Theme & constraint

### **Theme (Urban Absurdity):**

> Movement in the city is slowing down for unclear reasons

### **Constraint (Playful Limitation):**

> You must define the problem only through generated hypotheses before proposing any design

## Concept and User Story

**Concept**

MYCELIUM starts from a provocation: what if traffic jams are not a logistics problem, but a cognitive one? Researchers in the fiction of this app have found that before every major unexplained jam, a measurable signal appears — not in road sensors or GPS data, but in how people think. Independently. Across cities. Patterns of anticipation, drift, and convergence that precede the standstill by hours.

MYCELIUM is built to measure that signal. It is a collective intelligence platform — CI, not AI. Users ask questions through MYCI, a chat interface that distributes queries across a real human network and synthesizes the answers. The constraint bites here: no AI generates the responses. People do. The more users contribute (by answering small daily probes and cognitive tasks), the more accurate and personal the network becomes. The Mycelium Index — a score derived from the aggregate alignment of thousands of responses — tracks whether the network is converging. And when it rises fast, cities should probably pay attention.

**User story**

Charon, 32, works night shifts, moving through the city when it’s usually empty. Around 2:40 a.m., the route stalls for no clear reason—no traffic, no accident, just a cluster of vehicles idling at an empty intersection. It’s not the first time.

Charon waits. No one moves.

Later, scrolling through the phone, a link appears: *“You’ve been in The Jam.”*
Charon opens it.

The app doesn’t explain much. Just:

*“We should talk.”*

Charon taps through. It sounds strange. But also familiar.

Inside the chat:

“What should I do now?”

MYCI answers:

Don’t go with the first answer.
Wait a moment.
See what stays.

A brief pause.

What matters more right now—moving, or understanding why you’re here?

Charon taps  *wait* .

It disappears.

The conversation continues. The responses feel close. Not exact, but not generic either.

Before closing the app, Charon opens the map.

The same area from earlier is glowing faintly.

Charon stops.

For the first time, it doesn’t feel random.

## How to use it

1. **Open the live app** — you'll see the onboarding. Read each slide; they build on each other. On the final screen, select one word from the calibration grid. It sets the tone for your session.
2. **MYCI (center tab — ⬡)** — type any question about The Jam, cities, or collective behaviour. MYCI will respond as a synthesis of the network. Try: *"What does the network feel right now?"* or *"Why do jams happen with no cause?"*
3. **Contribute (◉ tab)** — complete the daily probes. Each answer contributes to the network and raises your Mycelium Index. Answers are short — choices, a single word, a symbol.
4. **Index (≋ tab)** — see your personal alignment scores: semantic convergence, predictive coherence, temporal synchrony. Watch them shift as you contribute.
5. **Map (◎ tab)** — switch between the global view (20 cities, live Mycelium Index) and the local Berlin view. Tap any city node to read its jam status and network contribution.
6. **Research (▽ tab)** — browse the field notes: what the data is showing, what the network has surfaced.

> **Tip:** Contribute at least twice and then ask MYCI something — the response will feel different.

## Technical implementation

- **Frontend:** React 18 + Vite, JavaScript (no TypeScript)
- **Styling:** Custom CSS variables, Google Fonts (Playfair Display, Plus Jakarta Sans)
- **Hosting & build:** GitHub Pages, deployed automatically via GitHub Actions on every push to `main`
- **APIs at runtime:** Anthropic Claude API (`claude-sonnet-4-6`) — powers the MYCI chat interface
- **Notable libraries:** `react-icons`, Canvas API (network node animation), SVG (world map continent outlines)
- **Run locally:**

```bash
git clone https://github.com/ofa5406/mycelium.git
cd mycelium
npm install
# create a .env file and add: VITE_ANTHROPIC_API_KEY=your_key_here
npm run dev
# open http://localhost:5173
```

## Working with AI

- **Coding agent:** Claude Code (claude-sonnet-4-6)
- **Key prompts that moved the project:**

  1. > *"Build a speculative CI app — Collective Intelligence, not Artificial Intelligence. Users ask MYCI questions, which distributes them across a human network. The network also asks users small cognitive probes. A Mycelium Index tracks alignment. The whole UI shifts to warm amber tones when the user contributes."*
     >
  2. > *"Redesign the onboarding as 11 cinematic slides that build the narrative of The Jam from scratch — no sign-up forms, just story."*
     >
  3. > *"Add a world map with 20 cities using equirectangular projection and SVG continent outlines, plus a local Berlin jam view with named street zones."*
     >
  4. > *"Set up GitHub Pages deployment via GitHub Actions, with the API key injected securely as a GitHub secret."*
     >
- **Reflection:** The agent was most useful as a co-writer — it helped shape the narrative voice (MYCI's responses, the onboarding text, the probe questions) as much as the code itself. The hardest part was keeping the speculative fiction consistent: the agent would occasionally slip into generic chatbot language and had to be pulled back toward uncertainty and distributed voice. The one thing I'd do differently: establish the fictional world rules in writing before starting to build, so every response the app generates feels like it comes from the same place.

## Credits, assets, licenses

- **Fonts:** Playfair Display (SIL Open Font License), Plus Jakarta Sans (SIL Open Font License) — served via Google Fonts
- **Data:** All city coordinates, jam indices, and network statistics are fictional and created for this project
- **Images / sounds:** None — all visuals are CSS and SVG
- **Third-party code:** React (MIT), Vite (MIT), Anthropic SDK (MIT)
- **This repo:** MIT
