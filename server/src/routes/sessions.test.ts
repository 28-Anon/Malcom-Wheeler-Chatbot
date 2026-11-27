import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { MAX_QUESTION_LENGTH } from "../config/limits.js";
import { buildDialogueGraph, type DialogueContent } from "../services/dialogueLoader.js";

/**
 * A small test conversation:
 *   intro_01 ─ polite (+10) ─▶ army_01 ─ secret (rapport 70+) ─▶ the_end
 *            ─ rude (-25) ───▶ rude_01 ─ ruder (-25) ─▶ door closed
 *            ─ leave ────────▶ the_end
 */
const content: DialogueContent = {
  graph: buildDialogueGraph([
    {
      name: "fixture.json",
      content: [
        {
          id: "intro_01",
          topic: "intro",
          type: "line",
          text: "Hello.",
          mood: "neutral",
          choices: [
            { id: "polite", text: "Polite.", next: "army_01", effects: { rapport: 10 } },
            { id: "rude", text: "Rude.", next: "rude_01", effects: { rapport: -25 } },
            { id: "leave", text: "Leave.", next: "the_end" },
          ],
        },
        {
          id: "rude_01",
          topic: "intro",
          type: "line",
          text: "I beg your pardon?",
          mood: "angry",
          choices: [{ id: "ruder", text: "Ruder.", next: "intro_01", effects: { rapport: -25 } }],
        },
        {
          id: "army_01",
          topic: "military",
          type: "line",
          text: "The Cavalry.",
          mood: "proud",
          choices: [
            { id: "back", text: "Back.", next: "intro_01" },
            { id: "secret", text: "A secret?", next: "the_end", conditions: { minRapport: 70 } },
          ],
        },
        { id: "the_end", topic: "ending", type: "ending", text: "Good day.", mood: "warm", choices: [] },
        { id: "ending_door_closed", topic: "ending", type: "ending", text: "We're finished.", mood: "angry", choices: [] },
      ],
    },
  ]),
  intents: [{ intent: "ask_army", keywords: ["army"], target: "army_01" }],
  fallbackLines: ["I'm not sure I follow you."],
};

/** Starts a conversation on a fresh app and returns the app and the session id. */
async function startConversation() {
  const app = createApp(content);
  const response = await request(app).post("/api/sessions");
  return { app, sessionId: response.body.sessionId as string, response };
}

describe("POST /api/sessions", () => {
  // ---------------------------------------------------------------
  // Test 1: Starting a conversation (requirement 1.1)
  // ---------------------------------------------------------------
  it("1.1: starts a conversation and returns the opening line, choices and a session id", async () => {
    const { response } = await startConversation();

    expect(response.status).toBe(201);
    expect(typeof response.body.sessionId).toBe("string");
    expect(response.body.node.id).toBe("intro_01");
    expect(response.body.choices.map((choice: { id: string }) => choice.id)).toEqual(["polite", "rude", "leave"]);
  });

  // ---------------------------------------------------------------
  // Test 2: Separate users get separate conversations
  // ---------------------------------------------------------------
  it("keeps each conversation separate", async () => {
    const app = createApp(content);
    const first = await request(app).post("/api/sessions");
    const second = await request(app).post("/api/sessions");

    // The first user is polite; the second user's rapport must not change
    await request(app).post(`/api/sessions/${first.body.sessionId}/choice`).send({ choiceId: "polite" });
    const secondAfter = await request(app).post(`/api/sessions/${second.body.sessionId}/choice`).send({ choiceId: "leave" });

    expect(first.body.sessionId).not.toBe(second.body.sessionId);
    expect(secondAfter.body.state.rapport).toBe(50);
  });
});

describe("POST /api/sessions/:id/choice", () => {
  // ---------------------------------------------------------------
  // Test 3: A choice moves the conversation and is remembered (requirements 1.3, 1.5)
  // ---------------------------------------------------------------
  it("1.3, 1.5: moves to the next node and remembers the new rapport", async () => {
    const { app, sessionId } = await startConversation();

    const response = await request(app).post(`/api/sessions/${sessionId}/choice`).send({ choiceId: "polite" });

    expect(response.status).toBe(200);
    expect(response.body.node.id).toBe("army_01");
    expect(response.body.state.rapport).toBe(60);
  });

  // ---------------------------------------------------------------
  // Test 4: Hidden and made-up choices are rejected (requirement 1.6, security)
  // ---------------------------------------------------------------
  it("1.6: rejects a hidden choice or one that doesn't exist with 400", async () => {
    const { app, sessionId } = await startConversation();
    await request(app).post(`/api/sessions/${sessionId}/choice`).send({ choiceId: "polite" });

    // At rapport 60, "secret" (needs 70) is hidden, but someone sends its id directly
    const hidden = await request(app).post(`/api/sessions/${sessionId}/choice`).send({ choiceId: "secret" });
    const madeUp = await request(app).post(`/api/sessions/${sessionId}/choice`).send({ choiceId: "zzz" });

    expect(hidden.status).toBe(400);
    expect(madeUp.status).toBe(400);
  });

  // ---------------------------------------------------------------
  // Test 5: Badly formed requests (requirement N6.2)
  // ---------------------------------------------------------------
  it("N6.2: rejects a missing or wrongly typed choice with 400", async () => {
    const { app, sessionId } = await startConversation();

    const missing = await request(app).post(`/api/sessions/${sessionId}/choice`).send({});
    const wrongType = await request(app).post(`/api/sessions/${sessionId}/choice`).send({ choiceId: 123 });

    expect(missing.status).toBe(400);
    expect(wrongType.status).toBe(400);
  });

  // ---------------------------------------------------------------
  // Test 6: Unknown sessions
  // ---------------------------------------------------------------
  it("returns 404 for a conversation that doesn't exist", async () => {
    const app = createApp(content);

    const response = await request(app).post("/api/sessions/not-a-real-id/choice").send({ choiceId: "polite" });

    expect(response.status).toBe(404);
  });

  // ---------------------------------------------------------------
  // Test 7: The door-closed ending (requirement 1.8)
  // ---------------------------------------------------------------
  it("1.8: ends the conversation when rapport falls below 25", async () => {
    const { app, sessionId } = await startConversation();
    await request(app).post(`/api/sessions/${sessionId}/choice`).send({ choiceId: "rude" });

    const response = await request(app).post(`/api/sessions/${sessionId}/choice`).send({ choiceId: "ruder" });

    expect(response.body.node.id).toBe("ending_door_closed");
    expect(response.body.state.ended).toBe(true);
  });

  // ---------------------------------------------------------------
  // Test 8: No choices after the end
  // ---------------------------------------------------------------
  it("returns 409 for a choice after the conversation has ended", async () => {
    const { app, sessionId } = await startConversation();
    await request(app).post(`/api/sessions/${sessionId}/choice`).send({ choiceId: "leave" });

    const response = await request(app).post(`/api/sessions/${sessionId}/choice`).send({ choiceId: "leave" });

    expect(response.status).toBe(409);
  });
});

describe("POST /api/sessions/:id/message", () => {
  // ---------------------------------------------------------------
  // Test 9: A typed question that matches (requirement 2.2)
  // ---------------------------------------------------------------
  it("2.2: moves to the matching node for a typed question", async () => {
    const { app, sessionId } = await startConversation();

    const response = await request(app).post(`/api/sessions/${sessionId}/message`).send({ text: "Tell me about the army" });

    expect(response.status).toBe(200);
    expect(response.body.node.id).toBe("army_01");
  });

  // ---------------------------------------------------------------
  // Test 10: A typed question that doesn't match (requirement 2.3)
  // ---------------------------------------------------------------
  it("2.3: replies with a fallback line and keeps the user where they were", async () => {
    const { app, sessionId } = await startConversation();

    const response = await request(app).post(`/api/sessions/${sessionId}/message`).send({ text: "What's the weather like?" });

    expect(response.body.node.text).toBe("I'm not sure I follow you.");
    expect(response.body.node.id).toBe("intro_01");
    expect(response.body.choices).toHaveLength(3);
  });

  // ---------------------------------------------------------------
  // Test 11: Empty and over-long questions (requirement 2.4)
  // ---------------------------------------------------------------
  it("2.4: rejects an empty question and one over the length limit with 400", async () => {
    const { app, sessionId } = await startConversation();

    const empty = await request(app).post(`/api/sessions/${sessionId}/message`).send({ text: "   " });
    const tooLong = await request(app)
      .post(`/api/sessions/${sessionId}/message`)
      .send({ text: "a".repeat(MAX_QUESTION_LENGTH + 1) });

    expect(empty.status).toBe(400);
    expect(tooLong.status).toBe(400);
  });
});

describe("security and robustness", () => {
  // ---------------------------------------------------------------
  // Test 12: The logic is never sent to the client (security)
  // ---------------------------------------------------------------
  it("never sends next links, effects or conditions in any response", async () => {
    const { app, sessionId, response: started } = await startConversation();
    const chosen = await request(app).post(`/api/sessions/${sessionId}/choice`).send({ choiceId: "polite" });

    for (const body of [started.body, chosen.body]) {
      const json = JSON.stringify(body);
      expect(json).not.toContain('"next"');
      expect(json).not.toContain('"effects"');
      expect(json).not.toContain('"conditions"');
    }
  });

  // ---------------------------------------------------------------
  // Test 13: Unreadable requests don't crash the server (requirement N6.2)
  // ---------------------------------------------------------------
  it("N6.2: answers unreadable JSON with a 400 JSON error, not a crash or an HTML page", async () => {
    const { app, sessionId } = await startConversation();

    const response = await request(app)
      .post(`/api/sessions/${sessionId}/choice`)
      .set("Content-Type", "application/json")
      .send('{"choiceId": ');
    expect(response.status).toBe(400);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.body.error).toBeDefined();
  });
});