/**
 * auth.test.ts
 * ─────────────
 * Tests for POST /api/auth/login
 * Verifies credential validation and JWT structure.
 * Does NOT hit a real database — the auth route is purely credential + JWT logic.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { authRoutes } from "../routes/auth.js";

// ── Test app ──────────────────────────────────────────────────────────────────

function buildApp() {
  const app = new Hono();
  app.route("/api/auth", authRoutes);
  return app;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function login(
  app: ReturnType<typeof buildApp>,
  username: string,
  password: string
) {
  return app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

/** Decode the JWT payload (base64url) without verifying the signature */
function decodeJwtPayload(token: string): Record<string, unknown> {
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    // Use env vars if set, otherwise fall back to defaults used in auth.ts
    process.env.STAFF_USERNAME = process.env.STAFF_USERNAME ?? "admin";
    process.env.STAFF_PASSWORD = process.env.STAFF_PASSWORD ?? "vcc2024";
    app = buildApp();
  });

  it("returns 200 with a JWT token for valid credentials", async () => {
    const res = await login(app, "admin", "vcc2024");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("token");
    expect(typeof body.token).toBe("string");
    expect(body.token.split(".")).toHaveLength(3); // valid JWT has 3 parts
  });

  it("returns the username and expiresIn in the response body", async () => {
    const res = await login(app, "admin", "vcc2024");
    const body = await res.json();
    expect(body.username).toBe("admin");
    expect(typeof body.expiresIn).toBe("number");
    expect(body.expiresIn).toBeGreaterThan(0);
  });

  it("JWT payload includes sub, role and exp claims", async () => {
    const res = await login(app, "admin", "vcc2024");
    const { token } = await res.json();
    const payload = decodeJwtPayload(token);

    expect(payload.sub).toBe("admin");
    expect(payload.role).toBe("staff");
    expect(typeof payload.exp).toBe("number");
  });

  it("JWT exp is set roughly 8 hours in the future", async () => {
    const res = await login(app, "admin", "vcc2024");
    const { token } = await res.json();
    const payload = decodeJwtPayload(token);

    const nowSec = Math.floor(Date.now() / 1000);
    const eightHours = 8 * 60 * 60;
    // Allow ±10 seconds of clock drift in CI
    expect(payload.exp as number).toBeGreaterThan(nowSec + eightHours - 10);
    expect(payload.exp as number).toBeLessThan(nowSec + eightHours + 10);
  });

  it("returns 401 for a wrong password", async () => {
    const res = await login(app, "admin", "wrong-password");
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toMatch(/invalid credentials/i);
  });

  it("returns 401 for a wrong username", async () => {
    const res = await login(app, "not-admin", "vcc2024");
    expect(res.status).toBe(401);
  });

  it("returns 400 when the request body is missing required fields", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin" }), // missing password
    });
    // zValidator returns 400 for schema violations
    expect(res.status).toBe(400);
  });

  it("returns 400 when the request body is not valid JSON", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    expect(res.status).toBe(400);
  });
});
