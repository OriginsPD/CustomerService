import { Hono } from "hono";
import { sign } from "hono/jwt";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const JWT_SECRET =
  process.env.JWT_SECRET ?? "vcc-dev-secret-change-in-production";

const STAFF_USERNAME = process.env.STAFF_USERNAME ?? "admin";
const STAFF_PASSWORD = process.env.STAFF_PASSWORD ?? "vcc2024";

// Token valid for 8 hours
const TOKEN_TTL_SECONDS = 8 * 60 * 60;

export const authRoutes = new Hono().post(
  "/login",
  zValidator(
    "json",
    z.object({ username: z.string(), password: z.string() })
  ),
  async (c) => {
    const { username, password } = c.req.valid("json");

    if (username !== STAFF_USERNAME || password !== STAFF_PASSWORD) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const token = await sign(
      {
        sub: username,
        role: "staff",
        exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
      },
      JWT_SECRET
    );

    return c.json({ token, username, expiresIn: TOKEN_TTL_SECONDS });
  }
);
