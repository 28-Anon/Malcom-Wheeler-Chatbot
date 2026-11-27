import { randomUUID } from "node:crypto";
import { Router, type Response } from "express";
import { validateBody } from "../middleware/validateBody.js";
import { DialogueError, chooseOption, startSession, toClientView } from "../services/dialogueEngine.js";
import type { DialogueContent } from "../services/dialogueLoader.js";
import { answerQuestion } from "../services/keywordMatcher.js";
import type { SessionStore } from "../services/sessionStore.js";
import { choiceRequestSchema, type ChoiceRequest } from "../validation/choiceRequestSchema.js";
import { messageSchema, type MessageBody } from "../validation/messageSchema.js";

/** The HTTP status for each engine error. */
const STATUS_FOR_ERROR: Record<DialogueError["code"], number> = {
  INVALID_CHOICE: 400, // the user sent a choice that isn't available
  SESSION_ENDED: 409, // the conversation has already finished
  UNKNOWN_NODE: 500, // a link points nowhere: a content bug, not the user's fault
  CONDITIONS_NOT_MET: 500, // a link leads to a node the user can't enter: also a content bug
};

/**
 * Sends the right response for an engine error. Anything else is passed on to the error handler.
 * Server errors get a general message, so internal details aren't shown to the user.
 */
function sendDialogueError(res: Response, error: unknown): void {
  if (!(error instanceof DialogueError)) throw error;

  const status = STATUS_FOR_ERROR[error.code];
  res.status(status).json({
    error: status === 500 ? "Something went wrong in the conversation." : error.message,
  });
}

/** Sends a 404 for a session id that doesn't exist (or was removed from the store). */
function sendSessionNotFound(res: Response): void {
  res.status(404).json({ error: "Conversation not found. Please start a new one." });
}

/**
 * The conversation API.
 * - POST /           starts a conversation
 * - POST /:id/choice  the user picks a choice
 * - POST /:id/message the user types a question
 * @param content - The dialogue graph, intents and fallback lines.
 * @param store - Where conversations are kept between requests.
 * @returns An Express router, mounted at /api/sessions.
 */
export function createSessionsRouter(content: DialogueContent, store: SessionStore): Router {
  const router = Router();
  const { graph, intents, fallbackLines } = content;

  router.post("/", (_req, res) => {
    // randomUUID makes ids that can't be guessed, so one user can't take over another's conversation
    const state = startSession(graph, randomUUID());
    store.save(state);
    res.status(201).json({ sessionId: state.sessionId, ...toClientView(graph, state) });
  });

  router.post("/:id/choice", validateBody(choiceRequestSchema), (req, res) => {
    const state = store.get(typeof req.params.id === "string" ? req.params.id : "");
    if (!state) {
      sendSessionNotFound(res);
      return;
    }

    const { choiceId } = req.body as ChoiceRequest;
    try {
      const next = chooseOption(graph, state, choiceId);
      store.save(next);
      res.json(toClientView(graph, next));
    } catch (error) {
      sendDialogueError(res, error);
    }
  });

  router.post("/:id/message", validateBody(messageSchema), (req, res) => {
    const state = store.get(typeof req.params.id === "string" ? req.params.id : "");
    if (!state) {
      sendSessionNotFound(res);
      return;
    }

    const { text } = req.body as MessageBody;
    try {
      const result = answerQuestion(graph, intents, fallbackLines, state, text);
      store.save(result.state);
      const view = toClientView(graph, result.state);

      if (result.fallbackLine === null) {
        res.json(view);
        return;
      }

      // Nothing matched: he says a fallback line, and the user stays where they were with the same choices
      res.json({ ...view, node: { ...view.node, text: result.fallbackLine, mood: "neutral" } });
    } catch (error) {
      sendDialogueError(res, error);
    }
  });

  return router;
}