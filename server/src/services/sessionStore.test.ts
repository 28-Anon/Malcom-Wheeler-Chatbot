import { describe, expect, it } from "vitest";
import type { SessionState } from "./dialogueEngine.js";
import { SessionStore } from "./sessionStore.js";

/** Builds a session state with the given id. */
function makeState(sessionId: string, rapport = 50): SessionState {
  return {
    sessionId,
    currentNodeId: "intro_01",
    rapport,
    flags: [],
    topicsUnlocked: [],
    topicsVisited: [],
    ended: false,
  };
}

/** Tests for keeping conversations in memory between requests. */
describe("SessionStore", () => {
  // ---------------------------------------------------------------
  // Test 1: Saving and finding a conversation
  // ---------------------------------------------------------------
  it("saves a conversation and finds it again by id", () => {
    const store = new SessionStore();
    store.save(makeState("abc"));

    expect(store.get("abc")?.sessionId).toBe("abc");
    expect(store.get("not-a-session")).toBeUndefined();
  });

  // ---------------------------------------------------------------
  // Test 2: Saving again replaces the old state
  // ---------------------------------------------------------------
  it("replaces a conversation's state when it is saved again", () => {
    const store = new SessionStore();
    store.save(makeState("abc", 50));
    store.save(makeState("abc", 60));

    expect(store.get("abc")?.rapport).toBe(60);
    expect(store.size).toBe(1);
  });

  // ---------------------------------------------------------------
  // Test 3: Removing a conversation when full (security)
  // ---------------------------------------------------------------
  it("removes a conversation when full, so memory can't be filled up", () => {
    // A store that holds only two, to test the limit without making 1000 sessions
    const store = new SessionStore(2);
    store.save(makeState("first"));
    store.save(makeState("second"));
    store.save(makeState("third"));

    expect(store.size).toBe(2);
    expect(store.get("first")).toBeUndefined();
    expect(store.get("third")).toBeDefined();
  });

  // ---------------------------------------------------------------
  // Test 4: Active conversations are kept
  // ---------------------------------------------------------------
  it("removes the least recently used conversation, not one that is still active", () => {
    const store = new SessionStore(2);
    store.save(makeState("first"));
    store.save(makeState("second"));

    // "first" is used again, so "second" is now the least recently used
    store.save(makeState("first", 60));
    store.save(makeState("third"));

    expect(store.get("first")).toBeDefined();
    expect(store.get("second")).toBeUndefined();
  });
});