import { db } from "./db/connection.js";
import { staffs } from "./db/schema.js";
import { eq } from "drizzle-orm";

async function checkJdoe() {
  const user = await db.select().from(staffs).where(eq(staffs.username, "jdoe"));
  console.log("User 'jdoe' status:", JSON.stringify(user, null, 2));
  process.exit(0);
}

checkJdoe();
