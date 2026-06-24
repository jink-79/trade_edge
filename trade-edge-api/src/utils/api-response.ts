import { Response } from "express";
import { HTTP_STATUS } from "../config/constants";

interface ApiResponsePayload<T> {
  success: boolean;
  message: string;
  data?: T;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = "Success",
  statusCode: number = HTTP_STATUS.OK,
): Response {
  const payload: ApiResponsePayload<T> = { success: true, message, data };
  return res.status(statusCode).json(payload);
}

export function sendCreated<T>(
  res: Response,
  data: T,
  message: string = "Created",
): Response {
  return sendSuccess(res, data, message, HTTP_STATUS.CREATED);
}

export function sendError(
  res: Response,
  message: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
): Response {
  const payload: ApiResponsePayload<null> = { success: false, message };
  return res.status(statusCode).json(payload);
}
