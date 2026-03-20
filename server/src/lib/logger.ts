/**
 * Structured logger — Winston singleton.
 *
 * Transports:
 *   Console  — colorized, human-readable (all levels)
 *   File     — logs/error.log    (errors only, JSON)
 *   File     — logs/combined.log (all levels, JSON)
 *
 * Log files are written to <repo-root>/logs/ so they are never inside
 * a published package and can be added to .gitignore cleanly.
 */

import { createLogger, format, transports } from "winston";
import { join } from "path";
import { mkdirSync } from "fs";

// process.cwd() is CustomerService/server/ (tsx watch runs from there).
// Logs live one level up at CustomerService/logs/ so they are repo-scoped.
const LOGS_DIR = join(process.cwd(), "..", "logs");

// Ensure the directory exists before Winston opens the file handles
mkdirSync(LOGS_DIR, { recursive: true });

export const logger = createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    // Console — pretty, colorized for local dev
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          const extras =
            Object.keys(meta).length > 0 ? " " + JSON.stringify(meta) : "";
          return `${timestamp} [${level}] ${message}${extras}`;
        })
      ),
    }),
    // Errors only → logs/error.log
    new transports.File({
      filename: join(LOGS_DIR, "error.log"),
      level: "error",
    }),
    // Everything → logs/combined.log
    new transports.File({
      filename: join(LOGS_DIR, "combined.log"),
    }),
  ],
});
