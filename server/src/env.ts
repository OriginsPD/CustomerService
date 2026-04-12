import * as dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the root of the monorepo
const envPath = path.resolve(__dirname, "../../.env");
console.log(`[DEBUG] Loading .env from: ${envPath}`);
const fs = await import("node:fs");
console.log(`[DEBUG] .env file exists: ${fs.existsSync(envPath)}`);

dotenv.config({ path: envPath });

console.log(`[DEBUG] TWILIO_ACCOUNT_SID present: ${!!process.env.TWILIO_ACCOUNT_SID}`);
console.log(`[DEBUG] Current process.env keys: ${Object.keys(process.env).filter(k => !k.startsWith("VSCODE") && !k.startsWith("GIT")).join(", ")}`);

const envSchema = z.object({
  // Server Config
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
  PUBLIC_URL: z.string().url().default("http://localhost:5173"),

  // Database
  DATABASE_URL: z.string().url(),

  // Auth
  JWT_SECRET: z.string().default("vcc-dev-secret-change-in-production"),
  STAFF_USERNAME: z.string().default("admin"),
  STAFF_PASSWORD: z.string().default("vcc2024"),

  // Twilio (Optional but validated if present)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // AI
  OPENCODE_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  // Don't exit in test/dev, just log. In production we might want to throw.
  if (process.env.NODE_ENV === "production") {
    throw new Error("Invalid environment variables");
  }
}

export const env = _env.success ? _env.data : ({} as z.infer<typeof envSchema>);
export default env;
