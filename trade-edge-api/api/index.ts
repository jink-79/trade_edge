// Vercel serverless entry for the whole Express app.
//
// Vercel never runs server.ts's `app.listen` bootstrap, so the DB connection and
// the DNS fix that used to live there must happen here instead. Every route in
// the Express app is served through this single function (see vercel.json), with
// the DB connection ensured (and cached) before each request is handled.

// mongodb+srv needs SRV DNS resolution; Vercel's default resolver can flake, so
// pin Google DNS — same fix server.ts applies for local runs. Must run before
// mongoose dials Atlas (which only happens inside the handler below).
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import type { IncomingMessage, ServerResponse } from "node:http";
import { connectDB } from "../src/config/db";
import app from "../src/app";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await connectDB();
  } catch {
    res.statusCode = 503;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ success: false, message: "Database unavailable — try again shortly." }));
    return;
  }
  // Express app is itself a (req, res) handler.
  return (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
