/**
 * queue.service.test.ts
 * ─────────────────────
 * Pure unit tests for the in-memory queue map.
 * No database — all functions under test are synchronous and side-effect-free
 * (apart from the EventEmitter, which we observe via event listeners).
 *
 * The DB connection module is mocked to prevent the "DATABASE_URL required"
 * error thrown on module load, since queue.service.ts imports it at the top
 * even though the tested functions don't use it.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock DB so the module-level import in queue.service.ts doesn't throw ──────

vi.mock("../db/connection.js", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

vi.mock("../db/schema.js", () => ({
  sessions: { id: "id", queueNumber: "queueNumber", status: "status" },
}));

// ── Import service after mocks ────────────────────────────────────────────────

import {
  registerSession,
  deregisterSession,
  getQueuePosition,
  getQueueDepth,
  getEstimatedWaitMinutes,
  getOrderedQueue,
  queueEvents,
} from "../services/queue.service.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function clearQueue(ids: string[]) {
  ids.forEach((id) => deregisterSession(id));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("queue.service — in-memory operations", () => {
  const IDS = ["sess-1", "sess-2", "sess-3"];

  beforeEach(() => {
    clearQueue(IDS);
  });

  // ── registerSession ───────────────────────────────────────────────────────

  describe("registerSession", () => {
    it("adds a session to the queue map", () => {
      registerSession("sess-1", 1);
      expect(getQueueDepth()).toBe(1);
    });

    it("emits a 'change' event on registration", () =>
      new Promise<void>((resolve) => {
        queueEvents.once("change", resolve);
        registerSession("sess-1", 1);
      }));

    it("registers multiple sessions independently", () => {
      registerSession("sess-1", 1);
      registerSession("sess-2", 2);
      registerSession("sess-3", 3);
      expect(getQueueDepth()).toBe(3);
    });
  });

  // ── deregisterSession ─────────────────────────────────────────────────────

  describe("deregisterSession", () => {
    it("removes a session from the queue map", () => {
      registerSession("sess-1", 1);
      deregisterSession("sess-1");
      expect(getQueueDepth()).toBe(0);
    });

    it("emits a 'change' event on deregistration", () =>
      new Promise<void>((resolve) => {
        registerSession("sess-1", 1);
        queueEvents.once("change", resolve);
        deregisterSession("sess-1");
      }));

    it("is a no-op for an unknown session", () => {
      expect(() => deregisterSession("unknown")).not.toThrow();
      expect(getQueueDepth()).toBe(0);
    });
  });

  // ── getQueuePosition ──────────────────────────────────────────────────────

  describe("getQueuePosition", () => {
    it("returns null for a session not in the queue", () => {
      expect(getQueuePosition("sess-1")).toBeNull();
    });

    it("returns position 1 when the session is first", () => {
      registerSession("sess-1", 1);
      expect(getQueuePosition("sess-1")).toBe(1);
    });

    it("returns the correct position with multiple sessions", () => {
      // Insert in non-sequential order to test sorting correctness
      registerSession("sess-3", 30);
      registerSession("sess-1", 10);
      registerSession("sess-2", 20);

      expect(getQueuePosition("sess-1")).toBe(1);
      expect(getQueuePosition("sess-2")).toBe(2);
      expect(getQueuePosition("sess-3")).toBe(3);
    });

    it("recalculates positions correctly after a session is removed", () => {
      registerSession("sess-1", 1);
      registerSession("sess-2", 2);
      registerSession("sess-3", 3);

      deregisterSession("sess-1");

      expect(getQueuePosition("sess-2")).toBe(1);
      expect(getQueuePosition("sess-3")).toBe(2);
    });
  });

  // ── getQueueDepth ─────────────────────────────────────────────────────────

  describe("getQueueDepth", () => {
    it("returns 0 when queue is empty", () => {
      expect(getQueueDepth()).toBe(0);
    });

    it("returns the correct count after additions and removals", () => {
      registerSession("sess-1", 1);
      registerSession("sess-2", 2);
      expect(getQueueDepth()).toBe(2);

      deregisterSession("sess-1");
      expect(getQueueDepth()).toBe(1);
    });
  });

  // ── getEstimatedWaitMinutes ───────────────────────────────────────────────

  describe("getEstimatedWaitMinutes", () => {
    it("returns 0 for a session not in the queue", () => {
      expect(getEstimatedWaitMinutes("sess-1")).toBe(0);
    });

    it("returns 0 for the first person in queue (position 1)", () => {
      registerSession("sess-1", 1);
      expect(getEstimatedWaitMinutes("sess-1")).toBe(0); // (1-1) * 8 = 0
    });

    it("returns 8 minutes for the second person in queue", () => {
      registerSession("sess-1", 1);
      registerSession("sess-2", 2);
      expect(getEstimatedWaitMinutes("sess-2")).toBe(8); // (2-1) * 8 = 8
    });

    it("returns 16 minutes for the third person in queue", () => {
      registerSession("sess-1", 1);
      registerSession("sess-2", 2);
      registerSession("sess-3", 3);
      expect(getEstimatedWaitMinutes("sess-3")).toBe(16); // (3-1) * 8 = 16
    });
  });

  // ── getOrderedQueue ───────────────────────────────────────────────────────

  describe("getOrderedQueue", () => {
    it("returns an empty array when queue is empty", () => {
      expect(getOrderedQueue()).toEqual([]);
    });

    it("returns sessions sorted by queue number ascending", () => {
      registerSession("sess-3", 30);
      registerSession("sess-1", 10);
      registerSession("sess-2", 20);

      const ordered = getOrderedQueue();
      expect(ordered.map((o) => o.sessionId)).toEqual(["sess-1", "sess-2", "sess-3"]);
      expect(ordered.map((o) => o.queueNumber)).toEqual([10, 20, 30]);
    });

    it("reflects live state after deregistration", () => {
      registerSession("sess-1", 1);
      registerSession("sess-2", 2);
      deregisterSession("sess-1");

      const ordered = getOrderedQueue();
      expect(ordered).toHaveLength(1);
      expect(ordered[0].sessionId).toBe("sess-2");
    });
  });
});
