import mongoose, { Connection } from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

/**
 * Separate, read-only connection to the phalanx-live Atlas cluster (Algo
 * Signals feature) — deliberately not the default Mongoose connection used
 * by config/db.ts, so models bound here can never collide with (or
 * accidentally be written to alongside) TradeEdge's own primary database.
 *
 * Created eagerly (but does not dial out until `connectPhalanxDB()` is
 * awaited) so modules can bind models to `phalanxConnection` at import time,
 * the same way the rest of the codebase binds models to the default
 * connection before it's necessarily open.
 */
export const phalanxConnection: Connection | null = isPhalanxConfigured()
  ? mongoose.createConnection(env.PHALANX_ATLAS_MONGODB_URI!, {
      dbName: env.PHALANX_ATLAS_DB_NAME,
      serverSelectionTimeoutMS: 8000,
    })
  : null;

export function isPhalanxConfigured(): boolean {
  return Boolean(env.PHALANX_ATLAS_MONGODB_URI && env.PHALANX_ATLAS_DB_NAME);
}

let connPromise: Promise<Connection> | null = null;

export function connectPhalanxDB(): Promise<Connection> {
  if (!phalanxConnection) {
    return Promise.reject(
      new Error("PHALANX_ATLAS_MONGODB_URI / PHALANX_ATLAS_DB_NAME not configured"),
    );
  }
  if (phalanxConnection.readyState === 1) return Promise.resolve(phalanxConnection);
  if (!connPromise) {
    connPromise = phalanxConnection.asPromise().then((conn) => {
      logger.info("✅ Phalanx Atlas connected");
      return conn;
    });
    phalanxConnection.on("error", (err) => {
      logger.error("❌ Phalanx Atlas connection failed:", err);
      connPromise = null; // let the next request retry
    });
    phalanxConnection.on("disconnected", () => logger.warn("Phalanx Atlas disconnected"));
  }
  return connPromise;
}
