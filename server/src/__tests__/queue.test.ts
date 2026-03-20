/**
 * queue.test.ts
 * ──────────────
 * Integration tests for the queue routes:
 *   GET   /api/queue                  — full ordered queue list
 *   GET   /api/queue/depth            — current queue depth
 *   GET   /api/queue/position/:id     — O(1) position lookup
 *   PATCH /api/queue/:id/process      — staff-only: mark client as served
 *
 * DB and queue service are mocked via vi.hoisted() so all mock references
 * are defined before vi.mock hoisting runs.
 * JWT signing reuses the same secret as the real auth route.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { sign } from "hono/jwt";

// ── vi.hoisted — all mocks defined before vi.mock() hoisting ──────────────────

const mocks = vi.hoisted(() => {
  // DB chain: each method returns the chain object so .set().where().returning() works
  const returning = vi.fn();
  const whereChain = vi.fn().mockReturnValue({ returning });
  const setChain = vi.fn().mockReturnValue({ where: whereChain, returning });
  const updateFn = vi.fn().mockReturnValue({ set: setChain, where: whereChain, returning });
  const findManyFn = vi.fn().mockResolvedValue([]);

  return {
    // DB
    update: updateFn,
    set: setChain,
    where: whereChain,
    returning,
    findMany: findManyFn,

    // Queue service
    getOrderedQueue: vi.fn(),
    getQueueDepth: vi.fn(),
    getQueuePosition: vi.fn(),
    getEstimatedWaitMinutes: vi.fn(),
    deregisterSession: vi.fn(),
  };
});

vi.mock("../services/queue.service.js", () => ({
  getOrderedQueue: mocks.getOrderedQueue,
  getQueueDepth: mocks.getQueueDepth,
  getQueuePosition: mocks.getQueuePosition,
  getEstimatedWaitMinutes: mocks.getEstimatedWaitMinutes,
  deregisterSession: mocks.deregisterSession,
  queueEvents: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
}));

vi.mock("../db/connection.js", () => ({
  db: {
    update: mocks.update,
    query: { sessions: { findMany: mocks.findMany } },
  },
}));

vi.mock("../db/schema.js", () => ({
  sessions: { id: "id", status: "status" },
}));

// ── Import routes AFTER mocks ─────────────────────────────────────────────────

import { queueRoutes } from "../routes/queue.js";
import { JWT_SECRET } from "../routes/auth.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildApp() {
  const app = new Hono();
  app.route("/api/queue", queueRoutes);
  return app;
}

async function makeStaffToken(overrides: Record<string, unknown> = {}): Promise<string> {
  return sign(
    { sub: "admin", role: "staff", exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60, ...overrides },
    JWT_SECRET,
    "HS256"
  );
}

async function makeExpiredToken(): Promise<string> {
  return sign(
    { sub: "admin", role: "staff", exp: Math.floor(Date.now() / 1000) - 1 },
    JWT_SECRET,
    "HS256"
  );
}

/** Reset call records WITHOUT wiping mock implementations */
function resetMocks() {
  mocks.update.mockClear();
  mocks.set.mockClear();
  mocks.where.mockClear();
  mocks.returning.mockClear();
  mocks.findMany.mockClear();
  mocks.getOrderedQueue.mockReset();
  mocks.getQueueDepth.mockReset();
  mocks.getQueuePosition.mockReset();
  mocks.getEstimatedWaitMinutes.mockReset();
  mocks.deregisterSession.mockClear();
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockDbSession = {
  id: "test-session-id",
  name: "Jane Doe",
  purpose: "General Inquiry",
  checkedInAt: new Date("2024-01-01T10:00:00Z"),
  status: "waiting",
};

// ── GET /api/queue ────────────────────────────────────────────────────────────

describe("GET /api/queue", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    resetMocks();
    mocks.findMany.mockResolvedValue([]);
    app = buildApp();
  });

  it("returns an empty array when queue is empty", async () => {
    mocks.getOrderedQueue.mockReturnValueOnce([]);

    const res = await app.request("/api/queue");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns formatted queue items with all required fields", async () => {
    mocks.getOrderedQueue.mockReturnValueOnce([
      { sessionId: "test-session-id", queueNumber: 1 },
    ]);
    mocks.findMany.mockResolvedValueOnce([mockDbSession]);

    const res = await app.request("/api/queue");
    expect(res.status).toBe(200);
    const [item] = await res.json();

    expect(item).toMatchObject({
      sessionId: "test-session-id",
      clientName: "Jane Doe",
      purpose: "General Inquiry",
      queueNumber: 1,
      queuePosition: 1,
    });
    expect(typeof item.estimatedWaitMinutes).toBe("number");
    expect(typeof item.checkedInAt).toBe("string"); // ISO-serialised date
  });
});

// ── GET /api/queue/depth ──────────────────────────────────────────────────────

describe("GET /api/queue/depth", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    resetMocks();
    app = buildApp();
  });

  it("returns the current depth", async () => {
    mocks.getQueueDepth.mockReturnValueOnce(3);
    const res = await app.request("/api/queue/depth");
    expect(res.status).toBe(200);
    expect((await res.json()).depth).toBe(3);
  });

  it("returns 0 when queue is empty", async () => {
    mocks.getQueueDepth.mockReturnValueOnce(0);
    const res = await app.request("/api/queue/depth");
    expect((await res.json()).depth).toBe(0);
  });
});

// ── GET /api/queue/position/:sessionId ───────────────────────────────────────

describe("GET /api/queue/position/:sessionId", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    resetMocks();
    app = buildApp();
  });

  it("returns position and estimated wait for a session in the queue", async () => {
    mocks.getQueuePosition.mockReturnValueOnce(2);
    mocks.getEstimatedWaitMinutes.mockReturnValueOnce(8);

    const res = await app.request("/api/queue/position/test-session-id");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ sessionId: "test-session-id", queuePosition: 2, estimatedWaitMinutes: 8 });
  });

  it("returns 404 when session is not in the queue", async () => {
    mocks.getQueuePosition.mockReturnValueOnce(null);

    const res = await app.request("/api/queue/position/unknown");
    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/not in queue/i);
  });
});

// ── PATCH /api/queue/:id/process (JWT protected) ──────────────────────────────

describe("PATCH /api/queue/:id/process", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    resetMocks();
    // Default: DB update finds and returns the session
    mocks.returning.mockResolvedValue([{ id: "test-session-id" }]);
    app = buildApp();
  });

  // ── Authentication enforcement ─────────────────────────────────────────────

  it("returns 401 when no Authorization header is provided", async () => {
    const res = await app.request("/api/queue/test-session-id/process", { method: "PATCH" });
    expect(res.status).toBe(401);
    expect((await res.json()).error).toMatch(/unauthorized/i);
  });

  it("returns 401 when Authorization header is not a Bearer token", async () => {
    const res = await app.request("/api/queue/test-session-id/process", {
      method: "PATCH",
      headers: { Authorization: "Basic dXNlcjpwYXNz" },
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 for a tampered / invalid JWT", async () => {
    const res = await app.request("/api/queue/test-session-id/process", {
      method: "PATCH",
      headers: { Authorization: "Bearer not.a.real.jwt" },
    });
    expect(res.status).toBe(401);
    expect((await res.json()).error).toMatch(/invalid or expired/i);
  });

  it("returns 401 for an expired JWT — the root cause of Bug 2", async () => {
    const expiredToken = await makeExpiredToken();
    const res = await app.request("/api/queue/test-session-id/process", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    expect(res.status).toBe(401);
    expect((await res.json()).error).toMatch(/invalid or expired/i);
  });

  // ── Successful processing ──────────────────────────────────────────────────

  it("returns 200 and marks the client as in_progress with a valid JWT", async () => {
    const token = await makeStaffToken();
    const res = await app.request("/api/queue/test-session-id/process", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.sessionId).toBe("test-session-id");
  });

  it("calls deregisterSession after successful processing", async () => {
    const token = await makeStaffToken();
    await app.request("/api/queue/test-session-id/process", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(mocks.deregisterSession).toHaveBeenCalledWith("test-session-id");
  });

  it("returns 404 when the session does not exist in the database", async () => {
    mocks.returning.mockResolvedValueOnce([]); // empty array = not found

    const token = await makeStaffToken();
    const res = await app.request("/api/queue/test-session-id/process", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(404);
  });
});
