import { z } from "zod";

/** Moods Wheeler-Nicholson can be in (schema.md section 3). */
export const moodSchema = z.enum(["neutral", "proud", "warm", "bitter", "guarded", "amused", "angry"]);

/** Topic ids used across the conversation (schema.md section 3). */
export const topicIdSchema = z.enum(["intro", "military", "pulps", "founding", "downfall", "legacy", "ending"]);

/** Conditions that must all be true for a node, choice or intent to be available (schema.md section 5). */
export const conditionsSchema = z
  .object({
    minRapport: z.number().int().min(0).max(100).optional(),
    maxRapport: z.number().int().min(0).max(100).optional(),
    requiresTopics: z.array(topicIdSchema).optional(),
    requiresFlags: z.array(z.string().min(1)).optional(),
    blockedByFlags: z.array(z.string().min(1)).optional(),
  })
  .strict();

/** Changes applied when a choice is picked or a node is shown (schema.md section 6). */
export const effectsSchema = z
  .object({
    // Validation rule 7: rapport changes stay within -25 to +25
    rapport: z.number().int().min(-25).max(25).optional(),
    setFlags: z.array(z.string().min(1)).optional(),
    unlockTopics: z.array(topicIdSchema).optional(),
  })
  .strict();

/** A reply the user can pick (schema.md section 4). */
export const choiceSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1),
    next: z.string().min(1),
    conditions: conditionsSchema.optional(),
    effects: effectsSchema.optional(),
  })
  .strict();

/** One line spoken by Wheeler-Nicholson and the user's possible replies (schema.md section 3). */
export const dialogueNodeSchema = z
  .object({
    id: z.string().min(1),
    topic: topicIdSchema,
    type: z.enum(["line", "hub", "ending"]),
    text: z.string().min(1),
    mood: moodSchema,
    conditions: conditionsSchema.optional(),
    onEnter: effectsSchema.optional(),
    choices: z.array(choiceSchema),
  })
  .strict()
  // Validation rule 3: endings have no choices, every other node has at least one
  .refine((node) => (node.type === "ending" ? node.choices.length === 0 : node.choices.length > 0), {
    message: "Ending nodes must have no choices, and every other node must have at least one.",
  })
  // Choice ids are what the frontend sends back, so they must be unique within a node
  .refine((node) => new Set(node.choices.map((choice) => choice.id)).size === node.choices.length, {
    message: "Choice ids must be unique within a node.",
  });

/** A whole dialogue file, e.g. military.json. */
export const dialogueFileSchema = z.array(dialogueNodeSchema);

/** One entry in intents.json (schema.md section 9). */
export const intentSchema = z
  .object({
    intent: z.string().min(1),
    // Punctuation is stripped from the user's text before matching, so a keyword with punctuation could never match
    keywords: z.array(z.string().regex(/^[a-z0-9 ]+$/, "Keywords must be lower case with no punctuation.")).min(1),
    target: z.string().min(1),
    conditions: conditionsSchema.optional(),
  })
  .strict();

/** The whole of intents.json. */
export const intentsFileSchema = z.array(intentSchema);

/** The whole of fallbacks.json. */
export const fallbacksFileSchema = z.object({ fallbackLines: z.array(z.string().min(1)).min(1) }).strict();

/** The whole of topics.json. */
export const topicsFileSchema = z.array(z.object({ id: topicIdSchema, name: z.string().min(1) }).strict());

/** Types generated from the schemas above, so the rules and the types can never drift apart. */
export type Mood = z.infer<typeof moodSchema>;
export type TopicId = z.infer<typeof topicIdSchema>;
export type Conditions = z.infer<typeof conditionsSchema>;
export type Effects = z.infer<typeof effectsSchema>;
export type Choice = z.infer<typeof choiceSchema>;
export type DialogueNode = z.infer<typeof dialogueNodeSchema>;
export type Intent = z.infer<typeof intentSchema>;