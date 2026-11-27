import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  dialogueFileSchema,
  fallbacksFileSchema,
  intentsFileSchema,
  type DialogueNode,
  type Intent,
} from "../validation/dialogueSchema.js";

/** The folder holding the real dialogue data (server/src/data). */
export const DEFAULT_DATA_DIR = fileURLToPath(new URL("../data/", import.meta.url));

/** Nodes the engine relies on, which must always exist (schema.md rule 5 and section 10). */
const REQUIRED_NODE_IDS = ["intro_01", "ending_door_closed"];

/** Every dialogue node from every file, looked up by node id. */
export type DialogueGraph = Map<string, DialogueNode>;

/** One dialogue file's name and its parsed JSON content. */
export interface DialogueFile {
  name: string;
  content: unknown;
}

/** Everything the conversation needs: the nodes, the intents for typed questions, and the fallback lines. */
export interface DialogueContent {
  graph: DialogueGraph;
  intents: Intent[];
  fallbackLines: string[];
}

/**
 * Reads a file and parses it as JSON.
 * @param path - Where the file is.
 * @param name - The file's name, used in error messages.
 * @throws Error naming the file if it isn't valid JSON.
 */
function readJsonFile(path: string, name: string): unknown {
  const text = readFileSync(path, "utf8");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`${name}: not valid JSON`);
  }
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
    .map((name): DialogueFile => ({ name, content: readJsonFile(join(directory, name), name) }));

  return buildDialogueGraph(files);
}

/**
 * Loads everything the conversation needs and checks it all fits together.
 * Called when the server starts, so broken content stops the server starting
 * instead of failing halfway through someone's conversation.
 * @param dataDir - Folder containing dialogue/, intents.json and fallbacks.json.
 * @returns The dialogue graph, intents and fallback lines.
 * @throws Error describing the first problem found.
 */
export function loadDialogueContent(dataDir: string = DEFAULT_DATA_DIR): DialogueContent {
  const graph = loadDialogueGraph(join(dataDir, "dialogue"));

  const intents = intentsFileSchema.safeParse(readJsonFile(join(dataDir, "intents.json"), "intents.json"));
  if (!intents.success) {
    throw new Error(`intents.json: ${intents.error.issues[0]?.message ?? "invalid"}`);
  }

  const fallbacks = fallbacksFileSchema.safeParse(readJsonFile(join(dataDir, "fallbacks.json"), "fallbacks.json"));
  if (!fallbacks.success) {
    throw new Error(`fallbacks.json: ${fallbacks.error.issues[0]?.message ?? "invalid"}`);
  }

  for (const id of REQUIRED_NODE_IDS) {
    if (!graph.has(id)) throw new Error(`Required node "${id}" is missing.`);
  }

  // Validation rule 2: every choice and every intent points to a node that exists
  for (const node of graph.values()) {
    for (const choice of node.choices) {
      if (!graph.has(choice.next)) {
        throw new Error(`${node.id}: choice "${choice.id}" links to missing node "${choice.next}"`);
      }
    }
  }
  for (const intent of intents.data) {
    if (!graph.has(intent.target)) {
      throw new Error(`intents.json: "${intent.intent}" targets missing node "${intent.target}"`);
    }
  }

  return { graph, intents: intents.data, fallbackLines: fallbacks.data.fallbackLines };
}