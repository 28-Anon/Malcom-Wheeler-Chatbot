import type { RequestHandler } from "express";
import type { ZodType } from "zod";

/**
 * Express middleware that validates req.body against a Zod schema.
 * On failure it responds 400 with a readable error and stops the request.
 * On success it replaces req.body with the parsed (e.g. trimmed) data and continues.
 *
 * @param schema - Zod schema the request body must match.
 * @returns Express request handler.
 */
export function validateBody(schema: ZodType): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: result.error.issues[0]?.message ?? "Invalid request.",
        details: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
