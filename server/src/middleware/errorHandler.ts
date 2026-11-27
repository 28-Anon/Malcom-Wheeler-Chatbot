import type { ErrorRequestHandler } from "express";

/**
 * Works out the status for an unexpected error. Errors Express marks as the client's fault
 * (e.g. 400 for unreadable JSON, 413 for a body that's too large) keep their status. Anything else is a 500.
 */
function statusFor(error: unknown): number {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number" &&
    error.status >= 400 &&
    error.status < 500
  ) {
    return error.status;
  }
  return 500;
}

/**
 * Last-resort error handler. Turns any unexpected error into a JSON response, so the server never crashes
 * and never sends an HTML page or stack trace to the user (requirement N6.2).
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const status = statusFor(error);

  // Server errors are logged for us, but the user only sees a general message
  if (status === 500) console.error(error);

  res.status(status).json({
    error: status === 500 ? "Something went wrong on the server." : "The request could not be read.",
  });
};