const dns = require("node:dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import { env } from "./config/env";
import { connectDB } from "./config/db";
import { logger } from "./utils/logger";
import app from "./app";

async function bootstrap(): Promise<void> {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    logger.info(
      `🚀 TradeEdge API running on port ${env.PORT} [${env.NODE_ENV}]`,
    );
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled rejection:", reason);
    shutdown("UNHANDLED_REJECTION");
  });
}

bootstrap();
