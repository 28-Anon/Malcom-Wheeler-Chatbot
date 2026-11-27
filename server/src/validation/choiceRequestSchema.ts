import { z } from "zod";

/** Request body for POST /api/sessions/:id/choice. */
export const choiceRequestSchema = z.object({
  choiceId: z
    .string("Choice must be text.")
    .trim()
    .min(1, "Choice cannot be empty.")
    .max(50, "Choice id is too long."),
});

/** Validated shape of a choice request. */
export type ChoiceRequest = z.infer<typeof choiceRequestSchema>;