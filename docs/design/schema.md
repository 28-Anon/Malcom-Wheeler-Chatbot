# Dialogue Data Schema

Defines how the Wheeler-Nicholson conversation is stored (JSON) and what the server tracks for each session. This is the contract between the content (`server/src/data/`), the dialogue engine (`server/src/services/`) and the React frontend.

**Requirements covered:** 1.2–1.9, 2.1–2.3, 3.1–3.4, N6.1

---

## 1. Overview

- The conversation is a **graph of nodes**. Each node is one thing Wheeler-Nicholson says, plus the choices the user can make in reply.
- Choices point to the **next node** and can change the **session state** (rapport, flags, topics).
- Nodes and choices can have **conditions**, so some lines only appear once the user has earned them.
- The **engine** on the server reads the JSON, applies the rules, and sends the frontend only what it needs to display. The frontend never decides what happens next.

```
1. User clicks a choice
        │
        ▼
2. React sends POST /api/sessions/:id/choice
        │
        ▼
3. Express validates the request
        │
        ▼
4. Engine checks the choice is valid for the current node
        │
        ▼
5. Engine applies the choice's effects to the session state
        │
        ▼
6. Engine loads the next node from the JSON data and checks its conditions
        │
        ▼
7. Express returns { node, choices, state }
        │
        ▼
8. React displays the new line and choices
```

---

## 2. File layout

```
server/src/data/
├── dialogue/
│   ├── intro.json        # opening, hub node
│   ├── military.json     # cavalry career, the open letter, court-martial
│   ├── pulps.json        # adventure writing
│   ├── founding.json     # National Allied, New Fun, Siegel & Shuster
│   ├── downfall.json     # Donenfeld, Detective Comics, losing the company
│   ├── legacy.json       # Superman, Batman, regrets
│   └── endings.json      # the three endings
├── topics.json           # topic list for the "topics discovered" tracker
└── intents.json          # keywords for typed questions
```

One file per topic keeps each file small and lets team members edit different topics without merge conflicts. The loader merges them into one graph at start-up.

---

## 3. Dialogue node

```ts
/** One line spoken by Wheeler-Nicholson and the user's possible replies. */
interface DialogueNode {
  id: string;                 // unique, "topic_number", e.g. "founding_03"
  topic: TopicId;             // which topic this node belongs to
  type: "line" | "hub" | "ending";
  text: string;               // what he says
  mood: Mood;                 // shown in the UI (requirement 1.7)
  conditions?: Conditions;    // node only reachable if these are met (1.6)
  onEnter?: Effects;          // applied when the node is shown (e.g. unlock a topic)
  choices: Choice[];          // empty only when type === "ending"
}

type Mood = "neutral" | "proud" | "warm" | "bitter" | "guarded" | "amused" | "angry";

type TopicId = "intro" | "military" | "pulps" | "founding" | "downfall" | "legacy" | "ending";
```

- **line**: a normal step in the conversation.
- **hub**: the "what would you like to ask about?" node that lists available topics. The user returns here after finishing a topic.
- **ending**: no choices; the frontend shows the ending summary and a restart button (3.1, 3.4).

---

## 4. Choice

```ts
/** A reply the user can pick. */
interface Choice {
  id: string;                 // unique within the node, e.g. "a", "b", "c"
  text: string;               // what the user says
  next: string;               // id of the node this leads to
  conditions?: Conditions;    // choice hidden unless met
  effects?: Effects;          // applied when picked (1.5)
}
```

---

## 5. Conditions

All listed conditions must be true (logical AND). Missing fields are ignored.

```ts
interface Conditions {
  minRapport?: number;        // rapport >= value
  maxRapport?: number;        // rapport <= value
  requiresTopics?: TopicId[]; // all these topics already visited
  requiresFlags?: string[];   // all these flags set
  blockedByFlags?: string[];  // none of these flags set
}
```

---

## 6. Effects

```ts
interface Effects {
  rapport?: number;           // added to rapport, e.g. +10 or -15 (clamped 0–100)
  setFlags?: string[];        // flags to switch on, e.g. ["askedAboutSuperman"]
  unlockTopics?: TopicId[];   // topics that appear in the hub
}
```

---

## 7. Session state (held on the server, sent to the client)

```ts
/** Everything the engine knows about one user's conversation. */
interface SessionState {
  sessionId: string;
  currentNodeId: string;
  rapport: number;            // starts at 50, range 0–100
  flags: string[];
  topicsUnlocked: TopicId[];  // starts as ["military", "pulps", "founding"]
  topicsVisited: TopicId[];   // for the tracker (3.2) and conditions
  history: HistoryEntry[];    // for the conversation log (3.3)
  ended: boolean;
}

interface HistoryEntry {
  speaker: "mwn" | "user";
  text: string;
  nodeId?: string;
}
```

**Rapport bands** (used by conditions and endings):

| Rapport | Behaviour |
|---|---|
| 0–24 | Guarded. Short answers; may end the conversation (bitter ending). |
| 25–59 | Polite but formal. Public facts only. |
| 60–100 | Warm. Shares personal stories (the shooting, the locked office, regrets). |

---

## 8. Example: two connected nodes

```json
[
  {
    "id": "downfall_02",
    "topic": "downfall",
    "type": "line",
    "text": "Donenfeld printed my books and carried my debts. When I needed money for Detective Comics, he offered it, at the price of a partnership. I signed. A man with creditors at the door does not haggle long.",
    "mood": "guarded",
    "choices": [
      {
        "id": "a",
        "text": "That sounds like you had no real choice.",
        "next": "downfall_03",
        "effects": { "rapport": 10 }
      },
      {
        "id": "b",
        "text": "So you made a bad business deal?",
        "next": "downfall_03b",
        "effects": { "rapport": -10, "setFlags": ["challengedBusiness"] }
      },
      {
        "id": "c",
        "text": "What happened when you came back from Cuba?",
        "next": "downfall_04",
        "conditions": { "minRapport": 60 }
      }
    ]
  },
  {
    "id": "downfall_04",
    "topic": "downfall",
    "type": "line",
    "text": "Donenfeld paid for a cruise. A rest, he said. I came home tanned and found my office door locked and the lawyers already at work. I have had bullets fired at me, and that still stung worse.",
    "mood": "bitter",
    "conditions": { "minRapport": 60 },
    "onEnter": { "unlockTopics": ["legacy"], "setFlags": ["heardLockout"] },
    "choices": [
      { "id": "a", "text": "Did you ever see Superman's success coming?", "next": "legacy_01" },
      { "id": "b", "text": "Let's talk about something else.", "next": "intro_hub" }
    ]
  }
]
```

Choice `c` only appears for users with rapport 60 or more, so polite users hear the personal story and rude users don't.

---

## 9. Typed questions (`intents.json`)

The team's own matcher, not an LLM (requirements 2.1–2.3).

```json
[
  {
    "intent": "ask_siegel_shuster",
    "keywords": ["siegel", "shuster", "cleveland"],
    "target": "founding_05"
  },
  {
    "intent": "ask_army",
    "keywords": ["army", "cavalry", "military", "soldier", "major", "war"],
    "target": "military_01"
  }
]
```

**Character intents.** Character names are entry points into topics (see `persona.md`, section 7). They live in the same file:

```json
[
  { "intent": "char_doctor_occult", "keywords": ["doctor occult", "dr occult", "occult"], "target": "founding_char_occult" },
  { "intent": "char_henri_duval", "keywords": ["henri duval", "duval"], "target": "founding_char_duval" },
  { "intent": "char_slam_bradley", "keywords": ["slam bradley", "slam", "bradley"], "target": "founding_char_slam" },
  { "intent": "char_superman_warm", "keywords": ["superman", "man of steel", "action comics"], "target": "legacy_char_superman", "conditions": { "minRapport": 60 } },
  { "intent": "char_superman_cold", "keywords": ["superman", "man of steel", "action comics"], "target": "legacy_char_superman_deflect", "conditions": { "maxRapport": 59 } },
  { "intent": "char_batman", "keywords": ["batman", "bruce wayne", "detective comics 27"], "target": "legacy_char_batman" },
  { "intent": "char_later_heroes", "keywords": ["wonder woman", "flash", "justice league", "green lantern", "aquaman"], "target": "legacy_char_later" }
]
```

The two Superman intents share keywords; their conditions decide which one fires, so the same question gets a warm or a curt answer depending on rapport. Typed names of characters created after 1964 match nothing and get one of the fallback lines.

**Matching rules:**
1. Lower-case the input and strip punctuation.
2. Score each intent by the number of keywords found in the input.
3. Pick the highest score whose conditions are met. Ties go to the first intent in the file.
4. Score of 0 → reply with a random in-character fallback line from `fallbackLines` (e.g. *"I'm not sure I follow you, friend. Ask me about the Army, or the comics business."*) and stay on the current node.

---

## 10. Endings

| Ending | Trigger | Tone |
|---|---|---|
| **Reconciled** | Ending reached with rapport ≥ 70 and `heardLockout` set | He reflects that he started something larger than himself. |
| **Unfinished business** | Ending reached with rapport 25–69 | Polite goodbye; hints there was more to tell. Encourages replay. |
| **Door closed** | Rapport drops below 25 at any point | He ends the interview curtly. |

The engine checks rapport after every choice. If it falls below 25, it redirects to the "door closed" ending.

---

## 11. Validation rules (checked at start-up and in CI)

The data loader validates every file with Zod, and a graph validator script checks the whole graph (requirement N6.1). The build fails if any rule breaks.

1. Every node `id` is unique.
2. Every `choice.next` and `intent.target` points to a node that exists.
3. Every node except `type: "ending"` has at least one choice.
4. Every node and choice includes all required fields with the correct types.
5. Every node is reachable from `intro_01`.
6. Every non-ending node has at least one choice with no conditions, so the user can never get stuck.
7. Rapport effects stay within −25 to +25 per choice.
8. Every `topic` matches an entry in `topics.json`.

---

## 12. API responses that use this schema

The frontend only ever receives the current node with the choices filtered for this user, plus the state:

```json
{
  "node": { "id": "downfall_02", "text": "...", "mood": "guarded", "type": "line" },
  "choices": [ { "id": "a", "text": "..." }, { "id": "b", "text": "..." } ],
  "state": { "rapport": 55, "topicsVisited": ["military"], "topicsUnlocked": ["military", "pulps", "founding", "downfall"], "ended": false }
}
```

`next`, `effects` and `conditions` are **never** sent to the client. The user can't see or tamper with the logic, and the server stays the single source of truth.
