import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { dialogueFileSchema, type DialogueNode } from "../validation/dialogueSchema.js";

/** Every dialogue node from every file, looked up by node id. */
export type DialogueGraph = Map<string, DialogueNode>;

/** One dialogue file's name and its parsed JSON content. */
export interface DialogueFile {
  name: string;
  content: unknown;
}

/**
 * Validates each dialogue file and merges all their nodes into one graph.
 * Kept separate from reading files so it can be tested with sample data.
 * @param files - The name and parsed content of each dialogue file.
 * @returns All nodes, keyed by id.
 * @throws Error naming the file and the problem if a file is invalid or a node id is used twice.
 */
export function buildDialogueGraph(files: DialogueFile[]): DialogueGraph {
  const graph: DialogueGraph = new Map();

  for (const file of files) {
    const result = dialogueFileSchema.safeParse(file.content);
    if (!result.success) {
      const issue = result.error.issues[0];
      const location = issue?.path.join(".") || "file";
      throw new Error(`${file.name}: ${location}: ${issue?.message ?? "invalid dialogue data"}`);
    }

    for (const node of result.data) {
      // Validation rule 1: every node id is unique across all files
      if (graph.has(node.id)) {
        throw new Error(`${file.name}: duplicate node id "${node.id}"`);
      }
      graph.set(node.id, node);
    }
  }

  return graph;
}

/**
 * Reads every .json file in a folder and builds the dialogue graph from them.
 * @param directory - Folder containing the dialogue files.
 * @returns All nodes, keyed by id.
 * @throws Error naming the file if it is not valid JSON or fails validation.
 */
export function loadDialogueGraph(directory: string): DialogueGraph {
  const files = readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name): DialogueFile => {
      const text = readFileSync(join(directory, name), "utf8");
      try {
        return { name, content: JSON.parse(text) as unknown };
      } catch {
        throw new Error(`${name}: not valid JSON`);
      }
    });

  return buildDialogueGraph(files);
}