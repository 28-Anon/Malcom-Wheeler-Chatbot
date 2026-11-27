import { describe, expect, it } from "vitest";
import type { Intent } from "../validation/dialogueSchema.js";
import { DialogueError, startSession, type SessionState } from "./dialogueEngine.js";
import { buildDialogueGraph } from "./dialogueLoader.js";
import { answerQuestion, matchIntent, normaliseText } from "./keywordMatcher.js";

/** A small test conversation: an Army line, a rapport-locked secret, and a deflection. */
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
        choices: [{ id: "a", text: "Go on.", next: "army_01" }],
      },
      {
        id: "army_01",
        topic: "military",
        type: "line",
        text: "The Cavalry.",
        mood: "proud",
        choices: [{ id: "a", text: "Go on.", next: "intro_01" }],
      },
      {
        id: "secret_01",
        topic: "military",
        type: "line",
        text: "The full story.",
        mood: "guarded",
        conditions: { minRapport: 60 },
        choices: [{ id: "a", text: "Go on.", next: "intro_01" }],
      },
      {
        id: "deflect_01",
        topic: "military",
        type: "line",
        text: "I'd rather not say.",
        mood: "guarded",
        conditions: { maxRapport: 59 },
        choices: [{ id: "a", text: "Go on.", next: "intro_01" }],
      },
      { id: "the_end", topic: "ending", type: "ending", text: "Good day.", mood: "warm", choices: [] },
    ],
  },
]);

/** Test intents, in the order they'd appear in intents.json. Order matters for ties. */
const intents: Intent[] = [
  { intent: "early_cavalry", keywords: ["cavalry"], target: "intro_01" },
  { intent: "ask_army", keywords: ["army", "cavalry", "war"], target: "army_01" },
  { intent: "horses_first", keywords: ["horses"], target: "army_01" },
  { intent: "horses_second", keywords: ["horses"], target: "intro_01" },
  { intent: "shooting_warm", keywords: ["the shooting"], target: "secret_01", conditions: { minRapport: 60 } },
  { intent: "shooting_cold", keywords: ["the shooting"], target: "deflect_01", conditions: { maxRapport: 59 } },
  { intent: "sneaky", keywords: ["sneaky"], target: "secret_01" },
];

const fallbackLines = ["First fallback.", "Second fallback."];

/** A fresh session at the opening node, with rapport 50. */
function newSession(): SessionState {
  return startSession(graph, "test-session");
}

describe("normaliseText", () => {
  // ---------------------------------------------------------------
  // Test 1: Cleaning up typed text (schema.md section 9, rule 1)
  // ---------------------------------------------------------------
  it("lower-cases text, removes apostrophes and turns other punctuation into spaces", () => {
    expect(normaliseText("Tell me about the Court-Martial!")).toBe("tell me about the court martial");
    expect(normaliseText("That's all, thanks.")).toBe("thats all thanks");
    expect(normaliseText("  Dr.   Occult?  ")).toBe("dr occult");
  });
});

describe("matchIntent", () => {
  // ---------------------------------------------------------------
  // Test 2: Whole words only
  // ---------------------------------------------------------------
  it("only matches whole words, so 'war' doesn't match 'warm'", () => {
    expect(matchIntent(graph, intents, newSession(), "It was a warm day")).toBeNull();
    expect(matchIntent(graph, intents, newSession(), "Were you in the war?")?.intent).toBe("ask_army");
  });

  // ---------------------------------------------------------------
  // Test 3: Keywords with more than one word
  // ---------------------------------------------------------------
  it("matches keywords made of several words", () => {
    expect(matchIntent(graph, intents, newSession(), "What about the shooting?")?.intent).toBe("shooting_cold");
  });

  // ---------------------------------------------------------------
  // Test 4: Highest score wins (schema.md section 9, rule 3)
  // ---------------------------------------------------------------
  it("picks the intent with the most matching keywords, even if it comes later", () => {
    // early_cavalry scores 1 ("cavalry"). ask_army scores 2 ("army" and "cavalry").
    expect(matchIntent(graph, intents, newSession(), "Army and cavalry")?.intent).toBe("ask_army");
  });

  // ---------------------------------------------------------------
  // Test 5: Ties go to the first intent (schema.md section 9, rule 3)
  // ---------------------------------------------------------------
  it("gives a tie to the intent that comes first in the file", () => {
    expect(matchIntent(graph, intents, newSession(), "Tell me about the horses")?.intent).toBe("horses_first");
  });

  // ---------------------------------------------------------------
  // Test 6: Warm and cold pairs (requirement 1.6)
  // ---------------------------------------------------------------
  it("1.6: picks the warm or cold intent depending on rapport", () => {
    const low = newSession();
    const high = { ...newSession(), rapport: 60 };

    expect(matchIntent(graph, intents, low, "the shooting")?.target).toBe("deflect_01");
    expect(matchIntent(graph, intents, high, "the shooting")?.target).toBe("secret_01");
  });

  // ---------------------------------------------------------------
  // Test 7: Locked nodes can't be reached by typing (requirement 1.6, security)
  // ---------------------------------------------------------------
  it("1.6: won't reach a locked node even if the intent forgot the condition", () => {
    // "sneaky" has no conditions, but its target needs rapport 60
    expect(matchIntent(graph, intents, newSession(), "sneaky")).toBeNull();
    expect(matchIntent(graph, intents, { ...newSession(), rapport: 60 }, "sneaky")?.target).toBe("secret_01");
  });
});

describe("answerQuestion", () => {
  // ---------------------------------------------------------------
  // Test 8: A typed question moves the conversation (requirement 2.2)
  // ---------------------------------------------------------------
  it("2.2: moves to the matching node and doesn't change rapport", () => {
    const result = answerQuestion(graph, intents, fallbackLines, newSession(), "Tell me about the army");

    expect(result.state.currentNodeId).toBe("army_01");
    expect(result.fallbackLine).toBeNull();
    expect(result.state.rapport).toBe(50);
  });

  // ---------------------------------------------------------------
  // Test 9: Fallback when nothing matches (requirement 2.3)
  // ---------------------------------------------------------------
  it("2.3: stays on the current node and gives a fallback line when nothing matches", () => {
    const start = newSession();

    // A fixed "random" function, so the test knows which line it will get
    const first = answerQuestion(graph, intents, fallbackLines, start, "What's the weather?", () => 0);
    const second = answerQuestion(graph, intents, fallbackLines, start, "What's the weather?", () => 0.99);

    expect(first.state.currentNodeId).toBe("intro_01");
    expect(first.fallbackLine).toBe("First fallback.");
    expect(second.fallbackLine).toBe("Second fallback.");
  });

  // ---------------------------------------------------------------
  // Test 10: No questions after the conversation has ended
  // ---------------------------------------------------------------
  it("rejects questions after the conversation has ended", () => {
    const ended = { ...newSession(), currentNodeId: "the_end", ended: true };

    expect(() => answerQuestion(graph, intents, fallbackLines, ended, "army")).toThrow(DialogueError);
  });
});