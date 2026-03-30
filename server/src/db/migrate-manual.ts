import { db } from "./connection.js";
import { sql } from "drizzle-orm";

async function run() {
  try {
    await db.execute(sql`ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "called_up_at" timestamp with time zone;`);
    console.log("Migration executed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

run();
