/**
 * reset-sessions.ts
 * ─────────────────
 * One-shot script that wipes every session and all data that depends on it:
 *   sessions → feedback → feedback_answers   (cascade)
 *             → cancellation_feedback        (cascade)
 *
 * Dynamic questions and the AI decision log are intentionally KEPT — they
 * are staff/AI configuration data, not client session data.
 *
 * Usage (from repo root):
 *   npm run db:reset-sessions -w server
 *
 * Or directly:
 *   cd server && npx tsx src/db/reset-sessions.ts
 */

import "dotenv/config";
import { db } from "./connection.js";
import { sessions } from "./schema.js";

async function resetSessions() {
  console.log("\n⚠️  Clearing all client session data...");
  console.log(
    "   (feedback, cancellation_feedback and feedback_answers cascade automatically)\n"
  );

  // A single DELETE on sessions is enough — the FK ON DELETE CASCADE rules
  // propagate to feedback → feedback_answers and cancellation_feedback.
  const deleted = await db.delete(sessions).returning({ id: sessions.id });

  console.log(`✅  Deleted ${deleted.length} session(s).`);
  console.log(
    "\n   Dynamic questions and AI log are untouched."
  );
  console.log(
    "   Restart the server (or let tsx watch reload) to clear the in-memory queue map.\n"
  );

  process.exit(0);
}

resetSessions().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
