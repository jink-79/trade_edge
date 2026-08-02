import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

/**
 * Serverless-safe connection. On Vercel each request may hit a warm or cold
 * function instance; we cache the connect promise on the module so warm
 * invocations reuse the same pool instead of dialing Atlas every request. The
 * promise is cleared on failure so the next request can retry (instead of
 * getting a permanently-rejected cached promise). No process.exit here — that
 * belongs to the long-running server (server.ts), not a serverless handler.
 */
let connPromise: Promise<typeof mongoose> | null = null;

export function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose);
  if (!connPromise) {
    mongoose.set("strictQuery", true);
    connPromise = mongoose
      .connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 })
      .then((m) => {
        logger.info("✅ MongoDB connected");
        return m;
      })
      .catch((err) => {
        logger.error("❌ MongoDB connection failed:", err);
        connPromise = null; // let the next request retry
        throw err;
      });

    mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
    mongoose.connection.on("error", (err) => logger.error("MongoDB error:", err));
  }
  return connPromise;
}
