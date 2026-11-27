import type { Intent } from "../validation/dialogueSchema.js";
import { DialogueError, conditionsMet, enterNode, type SessionState } from "./dialogueEngine.js";
import type { DialogueGraph } from "./dialogueLoader.js";

/** The result of a typed question: the new state, and a fallback line if nothing matched. */
export interface QuestionResult {
  state: SessionState;
  fallbackLine: string | null;
}

/**
 * Prepares text for matching (schema.md section 9, rule 1): lower case, apostrophes removed,
 * other punctuation turned into spaces, and spaces tidied.
 * So "That's" becomes "thats", and "Court-Martial" becomes "court martial".
 * @param text - The user's question.
 * @returns The cleaned-up text.
 */
export function normaliseText(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Counts how many of an intent's keywords appear in the text as whole words (schema.md section 9, rule 2).
 * Whole words only, so "war" does not match "warm" and "owe" does not match "however".
 * @param intent - The intent to score.
 * @param normalisedText - The user's question, already passed through normaliseText.
 * @returns The number of keywords found.
 */
export function scoreIntent(intent: Intent, normalisedText: string): number {
  // Spaces at both ends mean a keyword only matches when it sits between word boundaries
  const padded = ` ${normalisedText} `;
  return intent.keywords.filter((keyword) => padded.includes(` ${keyword} `)).length;
}

/**
 * Finds the best intent for a typed question (schema.md section 9, rule 3).
 * Intents are skipped if their own conditions, or their target node's conditions, aren't met.
 * Ties go to the intent that comes first in intents.json.
 * @param graph - All dialogue nodes.
 * @param intents - The intents from intents.json, in file order.
 * @param state - The current session state.
 * @param question - The user's question as typed.
 * @returns The best matching intent, or null if nothing scores above zero.
 */
export function matchIntent(
  graph: DialogueGraph,
  intents: Intent[],
  state: SessionState,
  question: string,
): Intent | null {
  const text = normaliseText(question);
  let best: Intent | null = null;
  let bestScore = 0;

  for (const intent of intents) {
    const target = graph.get(intent.target);
    if (!target) continue;

    // Conditions are checked before scoring, so a warm/cold pair with the same keywords
    // always resolves to whichever one the user's rapport allows
    if (!conditionsMet(intent.conditions, state) || !conditionsMet(target.conditions, state)) continue;

    const score = scoreIntent(intent, text);
    // Only a strictly higher score replaces the current best, so ties go to the earlier intent
    if (score > bestScore) {
      best = intent;
      bestScore = score;
    }
  }

  return best;
}

/**
 * Answers a typed question. Moves to the matching intent's node, or stays on the current node
 * and returns a fallback line if nothing matches (schema.md section 9, rule 4).
 * Typed questions don't change rapport.
 * @param graph - All dialogue nodes.
 * @param intents - The intents from intents.json, in file order.
 * @param fallbackLines - The in-character lines from fallbacks.json.
 * @param state - The current session state.
 * @param question - The user's question as typed.
 * @param random - Returns a number from 0 up to 1, used to pick a fallback line. Can be replaced in tests.
 * @returns The new state, and the fallback line if nothing matched.
 * @throws DialogueError if the conversation has already ended.
 */
export function answerQuestion(
  graph: DialogueGraph,
  intents: Intent[],
  fallbackLines: string[],
  state: SessionState,
  question: string,
  random: () => number = Math.random,
): QuestionResult {
  if (state.ended) {
    throw new DialogueError("SESSION_ENDED", "This conversation has already ended.");
  }

  const intent = matchIntent(graph, intents, state, question);
  if (intent) {
    return { state: enterNode(graph, state, intent.target), fallbackLine: null };
  }

  const index = Math.floor(random() * fallbackLines.length);
  return { state, fallbackLine: fallbackLines[index] ?? fallbackLines[0] ?? "" };
}