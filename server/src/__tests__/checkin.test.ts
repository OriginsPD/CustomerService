/**
 * checkin.test.ts
 * ────────────────
 * Integration tests for the check-in routes:
 *   POST   /api/checkin              — create session
 *   GET    /api/checkin/:id          — fetch session
 *   POST   /api/checkin/:id/cancel   — cancel + store feedback
 *   PATCH  /api/checkin/:id/status   — update status
 *
 * The database and queue service are mocked so these tests run without a
 * real Postgres connection.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

// ── vi.hoisted — create mock fns before vi.mock hoisting runs ─────────────────

const mocks = vi.hoisted(() => {
  const mockFindFirst = vi.fn();
  const mockTransaction = vi.fn().mockImplementation(
    async (fn: (tx: unknown) => Promise<unknown>) => {
      await fn({
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([]),
        }),
      });
    }
  );

  return {
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    }),
    transaction: mockTransaction,
    findFirst: mockFindFirst,

    // Queue service
    registerSession: vi.fn(),
    deregisterSession: vi.fn(),
    getNextQueueNumber: vi.fn().mockResolvedValue(1),
    getQueuePosition: vi.fn().mockReturnValue(1),
    getEstimatedWaitMinutes: vi.fn().mockReturnValue(0),
  };
});

vi.mock("../db/connection.js", () => ({
  db: {
    insert: mocks.insert,
    update: mocks.update,
    transaction: mocks.transaction,
    query: {
      sessions: { findFirst: mocks.findFirst },
    },
  },
}));

vi.mock("../db/schema.js", () => ({
  sessions: {},
  cancellationFeedback: {},
}));

vi.mock("../services/queue.service.js", () => ({
  registerSession: mocks.registerSession,
  deregisterSession: mocks.deregisterSession,
  getNextQueueNumber: mocks.getNextQueueNumber,
  getQueuePosition: mocks.getQueuePosition,
  getEstimatedWaitMinutes: mocks.getEstimatedWaitMinutes,
}));

// ── Import routes after mocks ─────────────────────────────────────────────────

import { checkinRoutes } from "../routes/checkin.js";

// ── Test app ──────────────────────────────────────────────────────────────────

function buildApp() {
  const app = new Hono();
  app.route("/api/checkin", checkinRoutes);
  return app;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const validCheckInBody = {
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "+1 555 000 0001",
  company: "Acme Corp",
  purpose: "General Inquiry",
};

const waitingSession = {
  id: "test-session-id",
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "+1 555 000 0001",
  company: "Acme Corp",
  purpose: "General Inquiry",
  queueNumber: 1,
  status: "waiting",
  checkedInAt: new Date("2024-01-01T10:00:00Z"),
  checkedOutAt: null,
};

const inProgressSession = { ...waitingSession, status: "in_progress" };
const completedSession  = { ...waitingSession, status: "completed" };
const cancelledSession  = { ...waitingSession, status: "cancelled" };

// ── POST /api/checkin ─────────────────────────────────────────────────────────

describe("POST /api/checkin", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getNextQueueNumber.mockResolvedValue(1);
    mocks.getQueuePosition.mockReturnValue(1);
    mocks.getEstimatedWaitMinutes.mockReturnValue(0);
    app = buildApp();
  });

  it("returns 200 with session details for valid input", async () => {
    const res = await app.request("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validCheckInBody),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      sessionId: expect.any(String),
      queueNumber: 1,
      queuePosition: 1,
      estimatedWaitMinutes: 0,
      clientName: "Jane Doe",
      purpose: "General Inquiry",
    });
    expect(body.checkedInAt).toBeDefined();
  });

  it("sessionId is a non-empty string", async () => {
    const res = await app.request("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validCheckInBody),
    });
    const { sessionId } = await res.json();
    expect(typeof sessionId).toBe("string");
    expect(sessionId.length).toBeGreaterThan(0);
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await app.request("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Jane" }), // missing email and purpose
    });
    expect(res.status).toBe(400);
  });

  it("accepts check-in without optional phone and company", async () => {
    const res = await app.request("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Jane Doe", email: "jane@example.com", purpose: "Billing Question" }),
    });
    expect(res.status).toBe(200);
  });

  it("calls registerSession with the correct sessionId and queue number", async () => {
    await app.request("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validCheckInBody),
    });

    expect(mocks.registerSession).toHaveBeenCalledWith(expect.any(String), 1);
  });
});

// ── GET /api/checkin/:id ──────────────────────────────────────────────────────

describe("GET /api/checkin/:id", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  it("returns the session data when session exists", async () => {
    mocks.findFirst.mockResolvedValueOnce(waitingSession);

    const res = await app.request("/api/checkin/test-session-id");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("test-session-id");
    expect(body.status).toBe("waiting");
  });

  it("serialises checkedInAt as an ISO string", async () => {
    mocks.findFirst.mockResolvedValueOnce(waitingSession);

    const res = await app.request("/api/checkin/test-session-id");
    const body = await res.json();
    expect(typeof body.checkedInAt).toBe("string");
    expect(body.checkedInAt).toBe("2024-01-01T10:00:00.000Z");
  });

  it("returns null for checkedOutAt when not checked out", async () => {
    mocks.findFirst.mockResolvedValueOnce(waitingSession);

    const res = await app.request("/api/checkin/test-session-id");
    const body = await res.json();
    expect(body.checkedOutAt).toBeNull();
  });

  it("returns 404 when session does not exist", async () => {
    mocks.findFirst.mockResolvedValueOnce(null);

    const res = await app.request("/api/checkin/nonexistent");
    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/not found/i);
  });
});

// ── POST /api/checkin/:id/cancel ──────────────────────────────────────────────

const validCancelBody = {
  reason: "Wait time was too long",
  wouldReschedule: false,
  additionalComment: "Next time maybe.",
};

describe("POST /api/checkin/:id/cancel", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  it("returns 200 when cancelling a 'waiting' session", async () => {
    mocks.findFirst.mockResolvedValueOnce(waitingSession);

    const res = await app.request("/api/checkin/test-session-id/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validCancelBody),
    });

    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it("returns 200 when cancelling an 'in_progress' session (fix: was 409 before)", async () => {
    // Staff has called the client up but the client wants to leave
    mocks.findFirst.mockResolvedValueOnce(inProgressSession);

    const res = await app.request("/api/checkin/test-session-id/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validCancelBody),
    });

    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it("returns 409 when session is already completed", async () => {
    mocks.findFirst.mockResolvedValueOnce(completedSession);

    const res = await app.request("/api/checkin/test-session-id/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validCancelBody),
    });

    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/already closed/i);
  });

  it("returns 409 when session is already cancelled", async () => {
    mocks.findFirst.mockResolvedValueOnce(cancelledSession);

    const res = await app.request("/api/checkin/test-session-id/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validCancelBody),
    });

    expect(res.status).toBe(409);
  });

  it("returns 404 when session does not exist", async () => {
    mocks.findFirst.mockResolvedValueOnce(null);

    const res = await app.request("/api/checkin/nonexistent/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validCancelBody),
    });

    expect(res.status).toBe(404);
  });

  it("returns 400 when reason field is missing", async () => {
    mocks.findFirst.mockResolvedValueOnce(waitingSession);

    const res = await app.request("/api/checkin/test-session-id/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wouldReschedule: false }),
    });

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/reason/i);
  });

  it("returns 400 for a malformed JSON body (fix: was unhandled 500 before)", async () => {
    const res = await app.request("/api/checkin/test-session-id/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-valid-json",
    });

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/invalid request body/i);
  });

  it("calls deregisterSession after successful cancellation", async () => {
    mocks.findFirst.mockResolvedValueOnce(waitingSession);

    await app.request("/api/checkin/test-session-id/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validCancelBody),
    });

    expect(mocks.deregisterSession).toHaveBeenCalledWith("test-session-id");
  });
});

// ── PATCH /api/checkin/:id/status ─────────────────────────────────────────────

describe("PATCH /api/checkin/:id/status", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  for (const status of ["waiting", "in_progress", "completed", "cancelled"] as const) {
    it(`accepts valid status '${status}'`, async () => {
      const res = await app.request("/api/checkin/test-session-id/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      expect(res.status).toBe(200);
    });
  }

  it("returns 400 for an invalid status string", async () => {
    const res = await app.request("/api/checkin/test-session-id/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "invalid" }),
    });
    expect(res.status).toBe(400);
  });

  it("calls deregisterSession when status is set to 'cancelled'", async () => {
    await app.request("/api/checkin/test-session-id/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    expect(mocks.deregisterSession).toHaveBeenCalledWith("test-session-id");
  });

  it("does not call deregisterSession for non-cancel status updates", async () => {
    await app.request("/api/checkin/test-session-id/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "in_progress" }),
    });
    expect(mocks.deregisterSession).not.toHaveBeenCalled();
  });
});
