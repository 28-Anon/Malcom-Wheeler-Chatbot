import type { Choice, Conditions, DialogueNode, Effects, Mood, TopicId } from "../validation/dialogueSchema.js";
import type { DialogueGraph } from "./dialogueLoader.js";

/** Where every conversation starts (schema.md validation rule 5). */
export const START_NODE_ID = "intro_01";

/** The ending the engine sends the user to when rapport falls too low (schema.md section 10). */
export const DOOR_CLOSED_NODE_ID = "ending_door_closed";

/** Rapport every conversation starts with (schema.md section 7). */
export const STARTING_RAPPORT = 50;

/** If rapport falls below this, Wheeler-Nicholson ends the conversation (schema.md section 10). */
export const DOOR_CLOSED_BELOW = 25;

/** Topics available in the hub from the start (schema.md section 7). */
export const STARTING_TOPICS: TopicId[] = ["military", "pulps", "founding"];

/** Topics not shown in the "topics explored" list, as they aren't subjects of the conversation. */
const UNTRACKED_TOPICS: TopicId[] = ["intro", "ending"];

/** Everything the server knows about one user's conversation (schema.md section 7). */
export interface SessionState {
  sessionId: string;
  currentNodeId: string;
  rapport: number;
  flags: string[];
  topicsUnlocked: TopicId[];
  topicsVisited: TopicId[];
  ended: boolean;
}

/** What the frontend receives: the current line, the choices it may show, and safe parts of the state. */
export interface ClientView {
  node: { id: string; text: string; mood: Mood; type: DialogueNode["type"] };
  choices: { id: string; text: string }[];
  state: { rapport: number; topicsVisited: TopicId[]; topicsUnlocked: TopicId[]; ended: boolean };
}

/** The ways a request can be rejected by the engine. */
export type DialogueErrorCode = "INVALID_CHOICE" | "SESSION_ENDED" | "UNKNOWN_NODE" | "CONDITIONS_NOT_MET";

/** An error from the engine, with a code the API can turn into the right HTTP status. */
export class DialogueError extends Error {
  readonly code: DialogueErrorCode;

  constructor(code: DialogueErrorCode, message: string) {
    super(message);
    this.name = "DialogueError";
    this.code = code;
  }
}

/** Returns a new list with the extra items added, without duplicates. */
function addUnique<T>(list: T[], items: T[] | undefined): T[] {
  return items ? [...new Set([...list, ...items])] : list;
}

/** Looks up a node by id, or throws if it doesn't exist. */
function getNode(graph: DialogueGraph, nodeId: string): DialogueNode {
  const node = graph.get(nodeId);
  if (!node) {
    throw new DialogueError("UNKNOWN_NODE", `No dialogue node with id "${nodeId}".`);
  }
  return node;
}

/**
 * Checks whether a set of conditions is met. All listed conditions must be true (schema.md section 5).
 * @param conditions - The conditions to check. Missing conditions always pass.
 * @param state - The current session state.
 * @returns True if every condition is met.
 */
export function conditionsMet(conditions: Conditions | undefined, state: SessionState): boolean {
  if (!conditions) return true;

  const { minRapport, maxRapport, requiresTopics = [], requiresFlags = [], blockedByFlags = [] } = conditions;

  if (minRapport !== undefined && state.rapport < minRapport) return false;
  if (maxRapport !== undefined && state.rapport > maxRapport) return false;
  if (!requiresTopics.every((topic) => state.topicsVisited.includes(topic))) return false;
  if (!requiresFlags.every((flag) => state.flags.includes(flag))) return false;
  if (blockedByFlags.some((flag) => state.flags.includes(flag))) return false;

  return true;
}

/**
 * Applies a choice's or node's effects and returns the new state (schema.md section 6).
 * Rapport is kept between 0 and 100.
 * @param state - The current session state.
 * @param effects - The effects to apply. If missing, the state is returned unchanged.
 * @returns A new state with the effects applied.
 */
export function applyEffects(state: SessionState, effects: Effects | undefined): SessionState {
  if (!effects) return state;

  return {
    ...state,
    rapport: Math.min(100, Math.max(0, state.rapport + (effects.rapport ?? 0))),
    flags: addUnique(state.flags, effects.setFlags),
    topicsUnlocked: addUnique(state.topicsUnlocked, effects.unlockTopics),
  };
}

/**
 * Moves the conversation to a node: records its topic, applies its onEnter effects,
 * and marks the session as ended if it's an ending.
 * @param graph - All dialogue nodes.
 * @param state - The current session state.
 * @param nodeId - The node to move to.
 * @returns The new state.
 * @throws DialogueError if the node doesn't exist or its conditions aren't met.
 */
export function enterNode(graph: DialogueGraph, state: SessionState, nodeId: string): SessionState {
  const node = getNode(graph, nodeId);

  if (!conditionsMet(node.conditions, state)) {
    throw new DialogueError("CONDITIONS_NOT_MET", `The conditions for "${nodeId}" are not met.`);
  }

  const topicsVisited = UNTRACKED_TOPICS.includes(node.topic)
    ? state.topicsVisited
    : addUnique(state.topicsVisited, [node.topic]);

  return applyEffects(
    { ...state, currentNodeId: node.id, topicsVisited, ended: node.type === "ending" },
    node.onEnter,
  );
}

/**
 * Starts a new conversation at the opening node.
 * @param graph - All dialogue nodes.
 * @param sessionId - The id for this conversation.
 * @returns The starting state.
 */
export function startSession(graph: DialogueGraph, sessionId: string): SessionState {
  const initial: SessionState = {
    sessionId,
    currentNodeId: START_NODE_ID,
    rapport: STARTING_RAPPORT,
    flags: [],
    topicsUnlocked: [...STARTING_TOPICS],
    topicsVisited: [],
    ended: false,
  };
  return enterNode(graph, initial, START_NODE_ID);
}

/**
 * The choices the user is allowed to see at the current node, after checking each one's conditions.
 * @param graph - All dialogue nodes.
 * @param state - The current session state.
 * @returns The visible choices.
 */
export function visibleChoices(graph: DialogueGraph, state: SessionState): Choice[] {
  return getNode(graph, state.currentNodeId).choices.filter((choice) => conditionsMet(choice.conditions, state));
}

/**
 * Handles the user picking a choice: applies its effects, then moves to the next node,
 * or to the door-closed ending if rapport has fallen too low.
 * @param graph - All dialogue nodes.
 * @param state - The current session state.
 * @param choiceId - The id of the choice the user picked.
 * @returns The new state.
 * @throws DialogueError if the conversation has ended or the choice isn't available.
 */
export function chooseOption(graph: DialogueGraph, state: SessionState, choiceId: string): SessionState {
  if (state.ended) {
    throw new DialogueError("SESSION_ENDED", "This conversation has already ended.");
  }

  // Only visible choices can be picked, so a user can't send the id of a hidden choice to skip a rapport check
  const choice = visibleChoices(graph, state).find((option) => option.id === choiceId);
  if (!choice) {
    throw new DialogueError("INVALID_CHOICE", `Choice "${choiceId}" is not available here.`);
  }

  const afterChoice = applyEffects(state, choice.effects);

  if (afterChoice.rapport < DOOR_CLOSED_BELOW) {
    return enterNode(graph, afterChoice, DOOR_CLOSED_NODE_ID);
  }

  return enterNode(graph, afterChoice, choice.next);
}

/**
 * Builds what the frontend is allowed to see. The next links, effects and conditions are never sent,
 * so the user can't see or tamper with the logic (schema.md section 12).
 * @param graph - All dialogue nodes.
 * @param state - The current session state.
 * @returns The current line, visible choices and safe parts of the state.
 */
export function toClientView(graph: DialogueGraph, state: SessionState): ClientView {
  const node = getNode(graph, state.currentNodeId);

  return {
    node: { id: node.id, text: node.text, mood: node.mood, type: node.type },
    choices: visibleChoices(graph, state).map(({ id, text }) => ({ id, text })),
    state: {
      rapport: state.rapport,
      topicsVisited: state.topicsVisited,
      topicsUnlocked: state.topicsUnlocked,
      ended: state.ended,
    },
  };
}