import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("5000").transform(Number),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CLIENT_URL: z.string().default("http://localhost:5173"),

  // Read-only connection to the separate phalanx-live Atlas cluster (Algo
  // Signals feature). Optional — unset in most dev environments; routes that
  // need it return a clear 503 if missing rather than failing startup.
  PHALANX_ATLAS_MONGODB_URI: z.string().optional(),
  PHALANX_ATLAS_DB_NAME: z.string().optional(),

  // Daily open-positions newsletter. All optional — the /run route returns a
  // clear error rather than crashing startup if one's missing.
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-flash-latest"),
  RESEND_API_KEY: z.string().optional(),
  NEWSLETTER_FROM_EMAIL: z.string().default("onboarding@resend.dev"),
  // Shared secret Vercel Cron sends as `Authorization: Bearer <CRON_SECRET>`.
  CRON_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
