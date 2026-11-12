/**
 * One-time cleanup: keep only your user and Bolero's own data.
 *
 *   npm run db:cleanup -- --email you@example.com            # dry run: lists what would go
 *   npm run db:cleanup -- --email you@example.com --confirm  # actually deletes
 *
 * Reads MONGODB_URI from .env. Take an Atlas backup or snapshot first.
 */
import dns from "node:dns";
import mongoose from "mongoose";
import dotenv from "dotenv";

dns.setServers(["8.8.8.8", "8.8.4.4"]); // same SRV fix as the server
dotenv.config();

// Collections Bolero uses. Everything else is left over from TradeEdge.
const KEEP_COLLECTIONS = ["users", "accounts", "snapshots", "possessions"];
const USER_SCOPED = ["accounts", "snapshots", "possessions"];

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function main(): Promise<void> {
  const email = arg("email")?.toLowerCase().trim();
  const confirm = process.argv.includes("--confirm");
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set (put it in .env).");
  if (!email) throw new Error("Pass the email to keep: --email you@example.com");

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db!;
  console.log(`Database: ${db.databaseName}`);
  console.log(confirm ? "Mode: DELETE\n" : "Mode: dry run (add --confirm to delete)\n");

  const users = db.collection("users");
  const me = await users.findOne({ email });
  if (!me) throw new Error(`No user with email ${email}. Nothing changed.`);

  const otherUsers = await users.countDocuments({ _id: { $ne: me._id } });
  console.log(`Keep user: ${me.fullName ?? ""} <${email}>`);
  console.log(`Other users to delete: ${otherUsers}`);

  const collections = (await db.listCollections().toArray()).map((c) => c.name);
  const drop = collections.filter((n) => !KEEP_COLLECTIONS.includes(n) && !n.startsWith("system."));
  console.log(`\nOld collections to drop (${drop.length}):`);
  for (const name of drop) {
    console.log(`  - ${name} (${await db.collection(name).estimatedDocumentCount()} docs)`);
  }

  console.log("\nOther users' Bolero data to delete:");
  for (const name of USER_SCOPED.filter((n) => collections.includes(n))) {
    const n = await db.collection(name).countDocuments({ userId: { $ne: me._id } });
    console.log(`  - ${name}: ${n} docs`);
  }

  if (!confirm) {
    console.log("\nDry run only. Nothing was changed.");
    return;
  }

  for (const name of drop) await db.collection(name).drop();
  for (const name of USER_SCOPED.filter((n) => collections.includes(n))) {
    await db.collection(name).deleteMany({ userId: { $ne: me._id } });
  }
  await users.deleteMany({ _id: { $ne: me._id } });
  console.log("\nDone.");
}

main()
  .catch((err) => {
    console.error(`\n${err instanceof Error ? err.message : err}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
