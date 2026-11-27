import type { SessionState } from "./dialogueEngine.js";

/** The most conversations kept in memory at once, so the server can't be filled up by creating endless sessions. */
export const MAX_SESSIONS = 1000;

/**
 * Keeps each conversation's state in memory between requests, looked up by session id.
 * When full, the least recently used conversation is removed to make room (an LRU cache).
 */
export class SessionStore {
  private readonly sessions = new Map<string, SessionState>();
  private readonly maxSessions: number;

  /**
   * @param maxSessions - The most conversations to keep at once. Can be lowered in tests.
   */
  constructor(maxSessions: number = MAX_SESSIONS) {
    this.maxSessions = maxSessions;
  }

  /**
   * Finds a conversation by its session id.
   * @param sessionId - The id returned when the conversation started.
   * @returns The conversation's state, or undefined if there isn't one with that id.
   */
  get(sessionId: string): SessionState | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Saves a conversation's latest state, replacing any earlier version.
   * If the store is full, the least recently used conversation is removed first.
   * @param state - The state to save. Its sessionId is used as the key.
   */
  save(state: SessionState): void {
    // Removing and re-adding moves this conversation to the back, so the first key is always the one used least recently
    this.sessions.delete(state.sessionId);

    if (this.sessions.size >= this.maxSessions) {
      const leastRecent = this.sessions.keys().next().value;
      if (leastRecent !== undefined) this.sessions.delete(leastRecent);
    }

    this.sessions.set(state.sessionId, state);
  }

  /** The number of conversations currently stored. */
  get size(): number {
    return this.sessions.size;
  }
}