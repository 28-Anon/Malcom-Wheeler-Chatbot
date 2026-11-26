import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildDialogueGraph, loadDialogueGraph } from "./dialogueLoader.js";

/** Builds a valid line node, with any fields replaced for a particular test. */
function makeNode(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "test_01",
    topic: "intro",
    type: "line",
    text: "A test line.",
    mood: "neutral",
    choices: [{ id: "a", text: "Go on.", next: "test_02" }],
    ...overrides,
  };
}

/**
 * Tests for loading and validating dialogue files.
 * Covers merging files into one graph and the validation rules in schema.md section 11.
 */
describe("buildDialogueGraph", () => {
  // ---------------------------------------------------------------
  // Test 1: Merging several files into one graph
  // ---------------------------------------------------------------
  it("merges the nodes from every file into one graph", () => {
    const graph = buildDialogueGraph([
      { name: "a.json", content: [makeNode({ id: "a_01" })] },
      { name: "b.json", content: [makeNode({ id: "b_01" }), makeNode({ id: "b_02" })] },
    ]);

    // Three nodes in total, and each can be looked up by id
    expect(graph.size).toBe(3);
    expect(graph.get("b_02")?.text).toBe("A test line.");
  });

  // ---------------------------------------------------------------
  // Test 2: Duplicate ids across files (rule 1)
  // ---------------------------------------------------------------
  it("rule 1: rejects a node id used in two files", () => {
    const files = [
      { name: "a.json", content: [makeNode({ id: "same_01" })] },
      { name: "b.json", content: [makeNode({ id: "same_01" })] },
    ];

    // The error names the second file and the repeated id, so it's easy to find
    expect(() => buildDialogueGraph(files)).toThrow(/b\.json: duplicate node id "same_01"/);
  });

  // ---------------------------------------------------------------
  // Test 3: Missing required field (rule 4)
  // ---------------------------------------------------------------
  it("rule 4: rejects a node with a missing field and says where it is", () => {
    const node = makeNode();
    delete node.mood;

    // "0.mood" means the first node in the file, field "mood"
    expect(() => buildDialogueGraph([{ name: "broken.json", content: [node] }])).toThrow(/broken\.json: 0\.mood/);
  });

  // ---------------------------------------------------------------
  // Test 4: Mood not in the allowed list (rule 4)
  // ---------------------------------------------------------------
  it("rule 4: rejects a mood that isn't in the allowed list", () => {
    const files = [{ name: "a.json", content: [makeNode({ mood: "furious" })] }];

    expect(() => buildDialogueGraph(files)).toThrow(/0\.mood/);
  });

  // ---------------------------------------------------------------
  // Test 5: Rapport change too large (rule 7)
  // ---------------------------------------------------------------
  it("rule 7: rejects a rapport change outside -25 to +25", () => {
    const files = [
      {
        name: "a.json",
        content: [makeNode({ choices: [{ id: "a", text: "Hi.", next: "x", effects: { rapport: 30 } }] })],
      },
    ];

    expect(() => buildDialogueGraph(files)).toThrow(/rapport/);
  });

  // ---------------------------------------------------------------
  // Test 6: Endings and choices (rule 3)
  // ---------------------------------------------------------------
  it("rule 3: rejects a line with no choices and an ending with choices", () => {
    const lineWithNoChoices = [{ name: "a.json", content: [makeNode({ choices: [] })] }];
    const endingWithChoices = [{ name: "b.json", content: [makeNode({ type: "ending" })] }];

    expect(() => buildDialogueGraph(lineWithNoChoices)).toThrow(/Ending nodes must have no choices/);
    expect(() => buildDialogueGraph(endingWithChoices)).toThrow(/Ending nodes must have no choices/);
  });

  // ---------------------------------------------------------------
  // Test 7: Misspelt field names
  // ---------------------------------------------------------------
  it("rejects a misspelt field instead of silently ignoring it", () => {
    // "condtions" is a typo for "conditions". Without strict checking it would be ignored,
    // and the node would be shown to everyone regardless of rapport.
    const files = [{ name: "a.json", content: [makeNode({ condtions: { minRapport: 60 } })] }];

    expect(() => buildDialogueGraph(files)).toThrow(/condtions/);
  });

  // ---------------------------------------------------------------
  // Test 8: Duplicate choice ids within a node
  // ---------------------------------------------------------------
  it("rejects two choices with the same id in one node", () => {
    const choices = [
      { id: "a", text: "First.", next: "x" },
      { id: "a", text: "Second.", next: "y" },
    ];
    const files = [{ name: "a.json", content: [makeNode({ choices })] }];

    expect(() => buildDialogueGraph(files)).toThrow(/Choice ids must be unique/);
  });
});

describe("loadDialogueGraph", () => {
  let folder: string;

  // Delete the temporary folder after each test
  afterEach(() => {
    rmSync(folder, { recursive: true, force: true });
  });

  // ---------------------------------------------------------------
  // Test 9: Reading files from a folder
  // ---------------------------------------------------------------
  it("reads every .json file in a folder and ignores other files", () => {
    // Arrange: a temporary folder with two dialogue files and one unrelated file
    folder = mkdtempSync(join(tmpdir(), "dialogue-"));
    writeFileSync(join(folder, "a.json"), JSON.stringify([makeNode({ id: "a_01" })]));
    writeFileSync(join(folder, "b.json"), JSON.stringify([makeNode({ id: "b_01" })]));
    writeFileSync(join(folder, "notes.txt"), "not dialogue");

    const graph = loadDialogueGraph(folder);

    expect(graph.size).toBe(2);
    expect(graph.has("a_01")).toBe(true);
  });

  // ---------------------------------------------------------------
  // Test 10: A file that isn't valid JSON
  // ---------------------------------------------------------------
  it("names the file when it isn't valid JSON", () => {
    // A missing closing bracket, the kind of mistake easily made when editing by hand
    folder = mkdtempSync(join(tmpdir(), "dialogue-"));
    writeFileSync(join(folder, "broken.json"), '[{ "id": "a_01" ');

    expect(() => loadDialogueGraph(folder)).toThrow(/broken\.json: not valid JSON/);
  });
});