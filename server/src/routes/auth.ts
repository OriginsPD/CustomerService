import { Hono } from "hono";
import { sign } from "hono/jwt";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { nanoid } from "nanoid";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "../db/connection.js";
import { staffs } from "../db/schema.js";
import { eq, isNull, and, sql } from "drizzle-orm";
import { logger } from "../lib/logger.js";
import { env } from "../env.js";

export const JWT_SECRET = env.JWT_SECRET;

// ── Native PBKDF2 cryptography ───────────────────────────────────────────────
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    const [salt, key] = hash.split(":");
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = scryptSync(password, salt, 64);
    return timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

// Token valid for 8 hours
const TOKEN_TTL_SECONDS = 8 * 60 * 60;

export const authRoutes = new Hono().post(
  "/login",
  zValidator(
    "json",
    z.object({ username: z.string(), password: z.string() })
  ),
  async (c) => {
    try {
      const { username, password } = c.req.valid("json");

      // Pre-flight check: Seed a default superadmin if the staffs table is completely empty.
      const result = await db.select({ count: sql<number>`count(*)` }).from(staffs);
      if (Number(result[0].count) === 0) {
        await db.insert(staffs).values({
          id: nanoid(),
          username: "admin",
          fullName: "System SuperAdmin",
          passwordHash: hashPassword(env.STAFF_PASSWORD),
          role: "superadmin",
        });
        logger.info("[Auth] Auto-seeded default superadmin staff identity.");
      }

      const staffMember = await db.query.staffs.findFirst({
        where: and(
          eq(staffs.username, username), 
          eq(staffs.isActive, true),
          isNull(staffs.deletedAt)
        ),
      });

      if (!staffMember || !verifyPassword(password, staffMember.passwordHash)) {
        return c.json({ error: "Invalid credentials" }, 401);
      }

      // Update last login
      await db.update(staffs)
        .set({ lastLogin: new Date() })
        .where(eq(staffs.id, staffMember.id));

      const token = await sign(
        {
          sub: staffMember.id,
          username: staffMember.username,
          role: staffMember.role,
          fullName: staffMember.fullName,
          exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
        },
        JWT_SECRET,
        "HS256"
      );

      return c.json({ 
        token, 
        username: staffMember.username, 
        role: staffMember.role,
        fullName: staffMember.fullName,
        expiresIn: TOKEN_TTL_SECONDS 
      });
    } catch (e) {
      logger.error("[Auth] Login route exception", { 
        error: (e as Error).message, 
        stack: (e as Error).stack,
        hasSecret: !!JWT_SECRET
      });
      return c.json({ error: "Server error" }, 500);
    }
  }
);
