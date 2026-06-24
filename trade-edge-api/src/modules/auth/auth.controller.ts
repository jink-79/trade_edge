import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendSuccess, sendCreated } from "../../utils/api-response";
import { registerUser, loginUser, getMe } from "./auth.service";
import type { RegisterInput, LoginInput } from "./auth.types";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as RegisterInput;
  const result = await registerUser(input);
  sendCreated(res, result, "Account created successfully");
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as LoginInput;
  const result = await loginUser(input);
  sendSuccess(res, result, "Login successful");
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  // req.user is guaranteed by authMiddleware
  const userId = req.user!.userId;
  const user = await getMe(userId);
  sendSuccess(res, user, "User fetched successfully");
});
