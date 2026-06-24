import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/api-error";
import { sendError } from "../utils/api-response";
import { logger } from "../utils/logger";
import { env } from "../config/env";
import { HTTP_STATUS } from "../config/constants";

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    // Zod v3 uses `issues` instead of `errors`
    const message = err.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    sendError(res, message, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    return;
  }

  // Operational errors (AppError)
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  // Mongoose duplicate key
  if (
    (err as NodeJS.ErrnoException).name === "MongoServerError" &&
    (err as any).code === 11000
  ) {
    const field = Object.keys((err as any).keyValue ?? {})[0] ?? "field";
    sendError(res, `${field} already exists`, HTTP_STATUS.CONFLICT);
    return;
  }

  // Mongoose cast error (invalid ObjectId etc.)
  if ((err as NodeJS.ErrnoException).name === "CastError") {
    sendError(res, "Invalid ID format", HTTP_STATUS.BAD_REQUEST);
    return;
  }

  // Unknown errors — log full stack in dev, generic message in prod
  logger.error("Unhandled error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
  });

  const message =
    env.NODE_ENV === "development"
      ? err.message
      : "Something went wrong. Please try again.";

  sendError(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
}
