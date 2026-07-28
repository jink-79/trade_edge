import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendSuccess } from "../../utils/api-response";
import { getPreferences, savePreferences } from "./preferences.service";
import type { SavePreferencesInput } from "./preferences.types";

export const get = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const prefs = await getPreferences(userId);
  sendSuccess(res, prefs, "Preferences fetched successfully");
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const input = req.body as SavePreferencesInput;
  const prefs = await savePreferences(userId, input);
  sendSuccess(res, prefs, "Preferences saved successfully");
});
