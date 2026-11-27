import { describe, expect, it } from "vitest";
import { loadDialogueContent } from "./dialogueLoader.js";

/**
 * Checks the real dialogue files in src/data, not test data.
 * If anyone breaks a dialogue file, intents.json or fallbacks.json, these tests fail.
 */
describe("real dialogue content", () => {
  // ---------------------------------------------------------------
  // Test 1: Everything loads and every link works
  // ---------------------------------------------------------------
  it("loads every file, passes validation, and every link points to a real node", () => {
    // loadDialogueContent throws if any file is invalid or any link is broken
    expect(() => loadDialogueContent()).not.toThrow();
  });

  // ---------------------------------------------------------------
  // Test 2: The nodes the engine relies on exist
  // ---------------------------------------------------------------
  it("includes the opening, the hub, the endings and the fallback lines", () => {
    const { graph, intents, fallbackLines } = loadDialogueContent();

    for (const id of ["intro_01", "intro_hub", "ending_01", "ending_reconciled", "ending_unfinished", "ending_door_closed"]) {
      expect(graph.has(id)).toBe(true);
    }
    expect(intents.length).toBeGreaterThan(0);
    expect(fallbackLines.length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------
  // Test 3: Every topic has dialogue (requirement 1.9)
  // ---------------------------------------------------------------
  it("1.9: has dialogue for at least five conversation topics", () => {
    const { graph } = loadDialogueContent();
        const topics = new Set<string>([...graph.values()].map((node) => node.topic));

    for (const topic of ["military", "pulps", "founding", "downfall", "legacy"]) {
      expect(topics.has(topic)).toBe(true);
    }
  });
});