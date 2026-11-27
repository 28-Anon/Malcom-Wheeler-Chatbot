import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockStart } from "./mockData";

/** Builds a fake fetch response with the given status and body. */
function fakeResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

/** The fake fetch, recording every request made. */
const fetchMock = vi.fn();

/** The client module, re-imported fresh before each test so the stored session id is cleared. */
let api: typeof import("./client");

beforeEach(async () => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.resetModules();
  api = await import("./client");
});

/**
 * Tests for the API client that talks to the Express server.
 */
describe("API client", () => {
  // ---------------------------------------------------------------
  // Test 1: Starting a conversation and remembering the session
  // ---------------------------------------------------------------
  it("starts a conversation and sends its session id with later choices", async () => {
    fetchMock
      .mockResolvedValueOnce(fakeResponse(201, { ...mockStart, sessionId: "abc-123" }))
      .mockResolvedValueOnce(fakeResponse(200, mockStart));

    const opening = await api.startConversation();
    await api.sendChoice("a");

    expect(opening.node.text).toBe(mockStart.node.text);
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/sessions", expect.objectContaining({ method: "POST" }));

    // The second request goes to this session's choice endpoint, with the choice in the body
    const [url, options] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe("/api/sessions/abc-123/choice");
    expect(JSON.parse(options.body as string)).toEqual({ choiceId: "a" });
  });

  // ---------------------------------------------------------------
  // Test 2: Sending a typed question
  // ---------------------------------------------------------------
  it("sends a typed question to the message endpoint", async () => {
    fetchMock
      .mockResolvedValueOnce(fakeResponse(201, { ...mockStart, sessionId: "abc-123" }))
      .mockResolvedValueOnce(fakeResponse(200, mockStart));

    await api.startConversation();
    await api.sendQuestion("Tell me about the Army");

    const [url, options] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe("/api/sessions/abc-123/message");
    expect(JSON.parse(options.body as string)).toEqual({ text: "Tell me about the Army" });
  });

  // ---------------------------------------------------------------
  // Test 3: Server errors keep the server's message
  // ---------------------------------------------------------------
  it("throws an ApiError with the server's message when a request fails", async () => {
    fetchMock
      .mockResolvedValueOnce(fakeResponse(201, { ...mockStart, sessionId: "abc-123" }))
      .mockResolvedValueOnce(fakeResponse(404, { error: "Conversation not found. Please start a new one." }));

    await api.startConversation();

    await expect(api.sendChoice("a")).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      message: "Conversation not found. Please start a new one.",
    });
  });

  // ---------------------------------------------------------------
  // Test 4: No choices before a conversation starts
  // ---------------------------------------------------------------
  it("refuses to send a choice before a conversation has started", async () => {
    await expect(api.sendChoice("a")).rejects.toThrow("No conversation has been started.");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});