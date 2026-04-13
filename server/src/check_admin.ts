import { db } from "./db/connection.js";
import { staffs } from "./db/schema.js";
import { eq } from "drizzle-orm";

async function checkAdmin() {
  try {
    const adminUser = await db.query.staffs.findFirst({
      where: eq(staffs.username, "admin"),
    });
    console.log("Admin user:", JSON.stringify(adminUser, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("Error checking admin user:", err);
    process.exit(1);
  }
}

checkAdmin();
