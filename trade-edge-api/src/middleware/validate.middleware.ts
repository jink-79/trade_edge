import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { sendError } from "../utils/api-response";
import { HTTP_STATUS } from "../config/constants";

type RequestPart = "body" | "query" | "params";

export function validate(schema: ZodSchema, part: RequestPart = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      const errors = (result.error as ZodError).issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");

      sendError(res, errors, HTTP_STATUS.UNPROCESSABLE_ENTITY);
      return;
    }

    // req.query and req.params are read-only in Express 5 — attach parsed
    // data on req for controllers to consume instead of overwriting
    if (part === "body") {
      req.body = result.data;
    } else {
      (req as any)[`parsed${part.charAt(0).toUpperCase() + part.slice(1)}`] =
        result.data;
    }

    next();
  };
}
