import { describe, expect, it } from "vitest";
import { buildDialogueGraph } from "./dialogueLoader.js";
import {
  DialogueError,
  STARTING_TOPICS,
  applyEffects,
  chooseOption,
  conditionsMet,
  enterNode,
  startSession,
  toClientView,
  type SessionState,
} from "./dialogueEngine.js";

/**
 * A small test conversation, built so each test can reach one rule:
 *   intro_01 ─ polite (+10) ──▶ founding_01 ─ secret (rapport 60+) ─▶ secret_01 ─▶ the_end
 *            ─ neutral ───────▶ founding_01 ─ leave ─────────────────────────────▶ the_end
 *            ─ rude (-25) ────▶ rude_01 ─ ruder (-25) ─▶ door closed (rapport below 25)
 */
const graph = buildDialogueGraph([
  {
    name: "fixture.json",
    content: [
      {
        id: "intro_01",
        topic: "intro",
        type: "line",
        text: "Hello.",
        mood: "neutral",
        choices: [
          { id: "polite", text: "Polite.", next: "founding_01", effects: { rapport: 10 } },
          { id: "neutral", text: "Neutral.", next: "founding_01" },
          { id: "rude", text: "Rude.", next: "rude_01", effects: { rapport: -25 } },
        ],
      },
      {
        id: "rude_01",
        topic: "intro",
        type: "line",
        text: "I beg your pardon?",
        mood: "angry",
        choices: [{ id: "ruder", text: "Ruder.", next: "intro_01", effects: { rapport: -25 } }],
      },
      {
        id: "founding_01",
        topic: "founding",
        type: "line",
        text: "I founded a company.",
        mood: "proud",
        onEnter: { unlockTopics: ["downfall"], setFlags: ["heardFounding"] },
        choices: [
          { id: "secret", text: "Tell me a secret.", next: "secret_01", conditions: { minRapport: 60 } },
          { id: "leave", text: "Goodbye.", next: "the_end" },
        ],
      },
      {
        id: "secret_01",
        topic: "founding",
        type: "line",
        text: "Here is a secret.",
        mood: "warm",
        conditions: { minRapport: 60 },
        choices: [{ id: "leave", text: "Goodbye.", next: "the_end" }],
      },
      { id: "the_end", topic: "ending", type: "ending", text: "Good day.", mood: "warm", choices: [] },
      { id: "ending_door_closed", topic: "ending", type: "ending", text: "We're finished.", mood: "angry", choices: [] },
    ],
  },
]);

/** Runs something that should throw a DialogueError and returns its error code. */
function errorCode(action: () => unknown): string | undefined {
  try {
    action();
  } catch (error) {
    return error instanceof DialogueError ? error.code : "not a DialogueError";
  }
  return undefined;
}

/** A fresh session at the opening node. */
function newSession(): SessionState {
  return startSession(graph, "test-session");
}

describe("startSession", () => {
  // ---------------------------------------------------------------
  // Test 1: Starting a conversation (requirement 1.1)
  // ---------------------------------------------------------------
  it("1.1: starts at the opening node with the starting rapport and topics", () => {
    const state = newSession();

    expect(state.currentNodeId).toBe("intro_01");
    expect(state.rapport).toBe(50);
    expect(state.topicsUnlocked).toEqual(STARTING_TOPICS);
    // "intro" isn't a subject of the conversation, so it isn't listed as explored
    expect(state.topicsVisited).toEqual([]);
    expect(state.ended).toBe(false);
  });
});

describe("chooseOption", () => {
  // ---------------------------------------------------------------
  // Test 2: Choices change where the conversation goes (requirement 1.3)
  // ---------------------------------------------------------------
  it("1.3: different choices lead to different nodes", () => {
    expect(chooseOption(graph, newSession(), "neutral").currentNodeId).toBe("founding_01");
    expect(chooseOption(graph, newSession(), "rude").currentNodeId).toBe("rude_01");
  });

  // ---------------------------------------------------------------
  // Test 3: Choices change rapport (requirement 1.5)
  // ---------------------------------------------------------------
  it("1.5: a choice's rapport effect raises or lowers rapport", () => {
    expect(chooseOption(graph, newSession(), "polite").rapport).toBe(60);
    expect(chooseOption(graph, newSession(), "rude").rapport).toBe(25);
  });

  // ---------------------------------------------------------------
  // Test 4: Entering a node applies its effects
  // ---------------------------------------------------------------
  it("applies a node's onEnter effects and records its topic as visited", () => {
    const state = chooseOption(graph, newSession(), "neutral");

    expect(state.topicsUnlocked).toContain("downfall");
    expect(state.flags).toContain("heardFounding");
    expect(state.topicsVisited).toEqual(["founding"]);
  });

  // ---------------------------------------------------------------
  // Test 5: Choices hidden by conditions (requirement 1.6)
  // ---------------------------------------------------------------
  it("1.6: only shows a choice when its conditions are met", () => {
    // Rapport 50: the secret needs 60, so only "leave" is shown
    const neutral = chooseOption(graph, newSession(), "neutral");
    expect(toClientView(graph, neutral).choices.map((choice) => choice.id)).toEqual(["leave"]);

    // Rapport 60 after the polite choice: the secret is now shown too
    const polite = chooseOption(graph, newSession(), "polite");
    expect(toClientView(graph, polite).choices.map((choice) => choice.id)).toEqual(["secret", "leave"]);
  });

  // ---------------------------------------------------------------
  // Test 6: Hidden choices can't be forced (requirement 1.6, security)
  // ---------------------------------------------------------------
  it("1.6: rejects a hidden choice even if its id is sent directly", () => {
    // Someone could send "secret" straight to the API to skip the rapport check
    const neutral = chooseOption(graph, newSession(), "neutral");

    expect(errorCode(() => chooseOption(graph, neutral, "secret"))).toBe("INVALID_CHOICE");
  });

  // ---------------------------------------------------------------
  // Test 7: Choice ids that don't exist
  // ---------------------------------------------------------------
  it("rejects a choice id that doesn't exist", () => {
    expect(errorCode(() => chooseOption(graph, newSession(), "z"))).toBe("INVALID_CHOICE");
  });

  // ---------------------------------------------------------------
  // Test 8: The door-closed ending (requirement 1.8)
  // ---------------------------------------------------------------
  it("1.8: ends the conversation when rapport falls below 25", () => {
    // 50 - 25 = 25, still allowed. 25 - 25 = 0, below 25, so he ends the conversation.
    const afterRude = chooseOption(graph, newSession(), "rude");
    const afterRuder = chooseOption(graph, afterRude, "ruder");

    expect(afterRude.ended).toBe(false);
    expect(afterRuder.currentNodeId).toBe("ending_door_closed");
    expect(afterRuder.ended).toBe(true);
  });

  // ---------------------------------------------------------------
  // Test 9: Nothing happens after an ending
  // ---------------------------------------------------------------
  it("marks the conversation as ended at an ending and rejects further choices", () => {
    const atFounding = chooseOption(graph, newSession(), "neutral");
    const ended = chooseOption(graph, atFounding, "leave");

    expect(ended.ended).toBe(true);
    expect(errorCode(() => chooseOption(graph, ended, "leave"))).toBe("SESSION_ENDED");
  });

  // ---------------------------------------------------------------
  // Test 10: The original state is never changed
  // ---------------------------------------------------------------
  it("returns a new state and leaves the original unchanged", () => {
    const start = newSession();
    chooseOption(graph, start, "polite");

    expect(start.rapport).toBe(50);
    expect(start.currentNodeId).toBe("intro_01");
  });
});

describe("enterNode", () => {
  // ---------------------------------------------------------------
  // Test 11: Nodes with conditions, and nodes that don't exist
  // ---------------------------------------------------------------
  it("refuses to enter a node whose conditions aren't met, or that doesn't exist", () => {
    expect(errorCode(() => enterNode(graph, newSession(), "secret_01"))).toBe("CONDITIONS_NOT_MET");
    expect(errorCode(() => enterNode(graph, newSession(), "no_such_node"))).toBe("UNKNOWN_NODE");
  });
});

describe("applyEffects", () => {
  // ---------------------------------------------------------------
  // Test 12: Rapport stays between 0 and 100
  // ---------------------------------------------------------------
  it("keeps rapport between 0 and 100", () => {
    const start = newSession();

    expect(applyEffects({ ...start, rapport: 95 }, { rapport: 10 }).rapport).toBe(100);
    expect(applyEffects({ ...start, rapport: 5 }, { rapport: -10 }).rapport).toBe(0);
  });

  // ---------------------------------------------------------------
  // Test 13: No duplicate flags or topics
  // ---------------------------------------------------------------
  it("doesn't add the same flag or topic twice", () => {
    const start = { ...newSession(), flags: ["heardFounding"] };
    const state = applyEffects(start, { setFlags: ["heardFounding"], unlockTopics: ["military"] });

    expect(state.flags).toEqual(["heardFounding"]);
    expect(state.topicsUnlocked.filter((topic) => topic === "military")).toHaveLength(1);
  });
});

describe("conditionsMet", () => {
  // ---------------------------------------------------------------
  // Test 14: Every type of condition (requirement 1.6)
  // ---------------------------------------------------------------
  it("1.6: checks every type of condition", () => {
    const state: SessionState = { ...newSession(), rapport: 60, flags: ["heardLockout"], topicsVisited: ["founding"] };

    expect(conditionsMet(undefined, state)).toBe(true);
    expect(conditionsMet({ minRapport: 60 }, state)).toBe(true);
    expect(conditionsMet({ minRapport: 61 }, state)).toBe(false);
    expect(conditionsMet({ maxRapport: 59 }, state)).toBe(false);
    expect(conditionsMet({ requiresTopics: ["founding"] }, state)).toBe(true);
    expect(conditionsMet({ requiresTopics: ["downfall"] }, state)).toBe(false);
    expect(conditionsMet({ requiresFlags: ["heardLockout"] }, state)).toBe(true);
    expect(conditionsMet({ blockedByFlags: ["heardLockout"] }, state)).toBe(false);
    // All conditions must be true together
    expect(conditionsMet({ minRapport: 60, requiresTopics: ["downfall"] }, state)).toBe(false);
  });
});

describe("toClientView", () => {
  // ---------------------------------------------------------------
  // Test 15: The logic is never sent to the client (security)
  // ---------------------------------------------------------------
  it("never sends next links, effects or conditions to the frontend", () => {
    const view = toClientView(graph, newSession());

    // Each choice has only its id and text
    for (const choice of view.choices) {
      expect(Object.keys(choice).sort()).toEqual(["id", "text"]);
    }
    expect(Object.keys(view.node).sort()).toEqual(["id", "mood", "text", "type"]);
  });
});