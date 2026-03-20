import "dotenv/config";
import { db } from "./connection.js";
import { dynamicQuestions } from "./schema.js";
import { nanoid } from "nanoid";

const initialQuestions = [
  {
    text: "How would you rate the speed of service you received today?",
    type: "scale" as const,
    displayOrder: 1,
  },
  {
    text: "Was the staff member able to fully resolve your issue?",
    type: "boolean" as const,
    displayOrder: 2,
  },
  {
    text: "Is there anything specific we could have done better?",
    type: "text" as const,
    displayOrder: 3,
  },
];

async function seed() {
  console.log("Seeding initial dynamic questions...");

  for (const q of initialQuestions) {
    await db.insert(dynamicQuestions).values({
      id: nanoid(),
      text: q.text,
      type: q.type,
      isActive: true,
      source: "manual",
      displayOrder: q.displayOrder,
    });
  }

  console.log(`Seeded ${initialQuestions.length} questions successfully.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
