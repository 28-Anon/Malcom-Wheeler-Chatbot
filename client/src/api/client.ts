import type { DialogueResponse } from "../types/dialogue";
import { mockEnding, mockStart } from "./mockData";

/*
 * API functions the frontend uses to talk to the server.
 * These currently return mock data. Once the Express session endpoints exist,
 * replace the bodies with fetch calls; the components will not need to change.
 */

/** Short pause so loading states can be seen while using mock data. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Starts a new conversation and returns the opening line. */
export async function startConversation(): Promise<DialogueResponse> {
  await delay(300);
  return mockStart;
}

/**
 * Sends the user's chosen reply and returns what Wheeler-Nicholson says next.
 * @param choiceId - The id of the choice the user picked.
 */
export async function sendChoice(choiceId: string): Promise<DialogueResponse> {
  await delay(300);
  void choiceId; // used once the real endpoint exists
  return mockEnding;
}

/**
 * Sends a typed question and returns Wheeler-Nicholson's reply.
 * @param question - The user's question, already trimmed and length-checked.
 */
export async function sendQuestion(question: string): Promise<DialogueResponse> {
  await delay(300);
  void question; // used once the real endpoint exists
  return mockEnding;
}