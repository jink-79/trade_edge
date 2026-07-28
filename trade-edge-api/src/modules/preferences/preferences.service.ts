import { Preferences } from "./preferences.model";
import {
  DEFAULT_PREFERENCES,
  type PreferencesResponse,
  type SavePreferencesInput,
} from "./preferences.types";

function format(doc: any): PreferencesResponse {
  return {
    tradingStyles: doc.tradingStyles ?? DEFAULT_PREFERENCES.tradingStyles,
    timeframe: doc.timeframe ?? DEFAULT_PREFERENCES.timeframe,
    defaultCapital: doc.defaultCapital ?? DEFAULT_PREFERENCES.defaultCapital,
    riskPerTrade: doc.riskPerTrade ?? DEFAULT_PREFERENCES.riskPerTrade,
    maxConcurrentPositions:
      doc.maxConcurrentPositions ?? DEFAULT_PREFERENCES.maxConcurrentPositions,
    atrPeriod: doc.atrPeriod ?? DEFAULT_PREFERENCES.atrPeriod,
    slAtrMultiplier: doc.slAtrMultiplier ?? DEFAULT_PREFERENCES.slAtrMultiplier,
    targetAtrMultiplier:
      doc.targetAtrMultiplier ?? DEFAULT_PREFERENCES.targetAtrMultiplier,
  };
}

/** Returns the user's preferences, or the defaults if they haven't saved any. */
export async function getPreferences(
  userId: string,
): Promise<PreferencesResponse> {
  const doc = await Preferences.findOne({ userId }).lean();
  return doc ? format(doc) : { ...DEFAULT_PREFERENCES };
}

/** Upserts the user's preferences. */
export async function savePreferences(
  userId: string,
  input: SavePreferencesInput,
): Promise<PreferencesResponse> {
  const doc = await Preferences.findOneAndUpdate(
    { userId },
    { ...input, userId },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
  return format(doc);
}
