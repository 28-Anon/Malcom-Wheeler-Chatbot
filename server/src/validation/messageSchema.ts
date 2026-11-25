import { z } from "zod";
import { MAX_QUESTION_LENGTH } from "../config/limits.js";

/**
 * Request body for POST /api/sessions/:id/message.
 * The question is trimmed, must not be empty, and must not exceed MAX_QUESTION_LENGTH characters.
 */
export const messageSchema = z.object({
  text: z
    .string("Question must be text.")
    .trim()
    .min(1, "Question cannot be empty.")
    .max(MAX_QUESTION_LENGTH, `Question must be ${MAX_QUESTION_LENGTH} characters or fewer.`),
});

/** Validated shape of a typed-question request. */
export type MessageBody = z.infer<typeof messageSchema>;
