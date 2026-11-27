import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorHandler.js";
import { createSessionsRouter } from "./routes/sessions.js";
import { loadDialogueContent, type DialogueContent } from "./services/dialogueLoader.js";
import { SessionStore } from "./services/sessionStore.js";

/**
 * Creates and configures the Express application.
 * @param content - The dialogue to use. Defaults to the real files in src/data. Tests can pass their own.
 * @param store - Where conversations are kept between requests.
 * @returns The configured Express app.
 */
export function createApp(content: DialogueContent = loadDialogueContent(), store: SessionStore = new SessionStore()) {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: "http://localhost:5173" }));
  app.use(express.json({ limit: "10kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/sessions", createSessionsRouter(content, store));

  // Must come last, so it catches errors from everything above
  app.use(errorHandler);

  return app;
}