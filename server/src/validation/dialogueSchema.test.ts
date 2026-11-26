import { describe, expect, it } from "vitest";
import { fallbacksFileSchema, intentSchema, topicsFileSchema } from "./dialogueSchema.js";

/**
 * Tests for the schemas used by intents.json, fallbacks.json and topics.json.
 */
describe("dialogue data schemas", () => {
  // ---------------------------------------------------------------
  // Test 1: A valid intent
  // ---------------------------------------------------------------
  it("accepts a valid intent with conditions", () => {
    const intent = {
      intent: "char_superman_warm",
      keywords: ["superman", "man of steel"],
      target: "legacy_char_superman",
      conditions: { minRapport: 60 },
    };

    expect(intentSchema.safeParse(intent).success).toBe(true);
  });

  // ---------------------------------------------------------------
  // Test 2: Keywords with punctuation
  // ---------------------------------------------------------------
  it("rejects a keyword with punctuation, as it could never match", () => {
    // The user's text has punctuation stripped before matching, so "that's all" would never be found
    const intent = { intent: "say_goodbye", keywords: ["that's all"], target: "ending_01" };

    expect(intentSchema.safeParse(intent).success).toBe(false);
  });

  // ---------------------------------------------------------------
  // Test 3: Fallback lines
  // ---------------------------------------------------------------
  it("requires at least one fallback line", () => {
    expect(fallbacksFileSchema.safeParse({ fallbackLines: ["I'm not sure I follow you."] }).success).toBe(true);
    expect(fallbacksFileSchema.safeParse({ fallbackLines: [] }).success).toBe(false);
  });

  // ---------------------------------------------------------------
  // Test 4: Topic ids (rule 8)
  // ---------------------------------------------------------------
  it("rule 8: rejects a topic id that isn't in the agreed list", () => {
    expect(topicsFileSchema.safeParse([{ id: "military", name: "Army career" }]).success).toBe(true);
    expect(topicsFileSchema.safeParse([{ id: "sport", name: "Sport" }]).success).toBe(false);
  });
});