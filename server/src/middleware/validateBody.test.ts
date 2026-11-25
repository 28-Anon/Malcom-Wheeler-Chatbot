import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { validateBody } from "./validateBody.js";
import { messageSchema } from "../validation/messageSchema.js";
import { MAX_QUESTION_LENGTH } from "../config/limits.js";

/** Minimal app that uses the real middleware and schema, echoing the validated body. */
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.post("/test", validateBody(messageSchema), (req, res) => {
    res.status(200).json({ received: req.body.text });
  });
  return app;
}

describe("typed question validation (FR 3.2)", () => {
  const app = createTestApp();

  it("accepts a question exactly at the limit", async () => {
    const res = await request(app).post("/test").send({ text: "a".repeat(MAX_QUESTION_LENGTH) });
    expect(res.status).toBe(200);
  });

  it("rejects a question one character over the limit with 400", async () => {
    const res = await request(app).post("/test").send({ text: "a".repeat(MAX_QUESTION_LENGTH + 1) });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain(String(MAX_QUESTION_LENGTH));
  });

  it("rejects an empty question", async () => {
    const res = await request(app).post("/test").send({ text: "" });
    expect(res.status).toBe(400);
  });

  it("rejects a question that is only spaces", async () => {
    const res = await request(app).post("/test").send({ text: "     " });
    expect(res.status).toBe(400);
  });

  it("rejects a missing text field", async () => {
    const res = await request(app).post("/test").send({});
    expect(res.status).toBe(400);
  });

  it("rejects a non-string text field", async () => {
    const res = await request(app).post("/test").send({ text: 123 });
    expect(res.status).toBe(400);
  });

  it("trims surrounding spaces before passing the question on", async () => {
    const res = await request(app).post("/test").send({ text: "  Who was Slam Bradley?  " });
    expect(res.status).toBe(200);
    expect(res.body.received).toBe("Who was Slam Bradley?");
  });
});
