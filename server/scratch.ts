import { db } from "./src/db/connection.js";
import { sql } from "drizzle-orm";

async function main() {
  try {
    const rawStringResult = await db.execute(`SELECT COUNT(*) FROM staffs`);
    console.log("Raw string result:", rawStringResult);
  } catch (e) {
    console.error("String error:", e);
  }

  try {
    const sqlResult = await db.execute(sql`SELECT COUNT(*) FROM staffs`);
    console.log("SQL result:", sqlResult);
  } catch (e) {
    console.error("SQL error:", e);
  }
  process.exit(0);
}

main();
