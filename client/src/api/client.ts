import type { DialogueResponse } from "../types/dialogue";

/*
 * API functions the frontend uses to talk to the Express server.
 * Requests go to /api, which Vite forwards to the server on port 3000 during development (see vite.config.ts).
 */

/** The current conversation's id, set when a conversation starts and sent with every request after that. */
let sessionId: string | null = null;

/** An error response from the server, with its HTTP status. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Sends a POST request to the server and returns the response body.
 * @param path - The path after /api, e.g. "/sessions".
 * @param body - The data to send as JSON.
 * @returns The parsed response.
 * @throws ApiError with the server's error message if the request fails.
 */
async function post<T>(path: string, body: unknown = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    // The server sends { error: "..." } for every failure. Fall back to the status if the body can't be read.
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(response.status, data.error ?? `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

/** The current session id, or an error if no conversation has been started. */
function currentSessionId(): string {
  if (!sessionId) throw new ApiError(0, "No conversation has been started.");
  return encodeURIComponent(sessionId);
}

/** Starts a new conversation and returns the opening line. */
export async function startConversation(): Promise<DialogueResponse> {
  const data = await post<DialogueResponse & { sessionId: string }>("/sessions");
  sessionId = data.sessionId;
  return data;
}

/**
 * Sends the user's chosen reply and returns what Wheeler-Nicholson says next.
 * @param choiceId - The id of the choice the user picked.
 */
export async function sendChoice(choiceId: string): Promise<DialogueResponse> {
  return post<DialogueResponse>(`/sessions/${currentSessionId()}/choice`, { choiceId });
}

/**
 * Sends a typed question and returns Wheeler-Nicholson's reply.
 * @param question - The user's question, already trimmed and length-checked.
 */
export async function sendQuestion(question: string): Promise<DialogueResponse> {
  return post<DialogueResponse>(`/sessions/${currentSessionId()}/message`, { text: question });
}