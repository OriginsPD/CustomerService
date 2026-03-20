import { EventEmitter } from "node:events";
import { db } from "../db/connection.js";
import { sessions } from "../db/schema.js";
import { eq, max } from "drizzle-orm";

// ── SSE event bus ─────────────────────────────────────────────────────────────
// SSE clients subscribe to "change" events to get instant queue updates.
export const queueEvents = new EventEmitter();
queueEvents.setMaxListeners(500); // support many concurrent staff connections

// ── In-memory O(1) queue map ──────────────────────────────────────────────────
// Maps sessionId → queueNumber for all currently "waiting" sessions.
// Initialized from DB on startup; updated on every check-in / check-out.

const queueMap = new Map<string, number>();

const AVG_SERVICE_MINUTES = 8; // baseline estimate per client

export async function initQueueMap(): Promise<void> {
  const waiting = await db
    .select({ id: sessions.id, queueNumber: sessions.queueNumber })
    .from(sessions)
    .where(eq(sessions.status, "waiting"));

  queueMap.clear();
  for (const s of waiting) {
    queueMap.set(s.id, s.queueNumber);
  }

  console.log(`[Queue] Initialized with ${queueMap.size} waiting session(s).`);
}

/** O(1) registration — called immediately after DB insert */
export function registerSession(sessionId: string, queueNumber: number): void {
  queueMap.set(sessionId, queueNumber);
  queueEvents.emit("change");
}

/** O(1) deregistration — called on check-out or cancellation */
export function deregisterSession(sessionId: string): void {
  queueMap.delete(sessionId);
  queueEvents.emit("change");
}

/**
 * Returns the 1-based queue position for a session.
 * O(k) where k = queue depth (practically bounded to ~100 at any time).
 */
export function getQueuePosition(sessionId: string): number | null {
  const myNumber = queueMap.get(sessionId); // O(1)
  if (myNumber === undefined) return null;

  let position = 1;
  for (const num of queueMap.values()) {
    if (num < myNumber) position++;
  }
  return position;
}

export function getQueueDepth(): number {
  return queueMap.size;
}

export function getEstimatedWaitMinutes(sessionId: string): number {
  const position = getQueuePosition(sessionId);
  if (position === null) return 0;
  return (position - 1) * AVG_SERVICE_MINUTES;
}

/** Returns all waiting sessions as an ordered array (for staff queue view) */
export function getOrderedQueue(): Array<{ sessionId: string; queueNumber: number }> {
  return Array.from(queueMap.entries())
    .map(([sessionId, queueNumber]) => ({ sessionId, queueNumber }))
    .sort((a, b) => a.queueNumber - b.queueNumber);
}

/**
 * Get next queue number — O(1) single MAX query using the existing index.
 * Monotonically increasing across all sessions (no daily reset to keep
 * queue numbers unique and easy to reference).
 */
export async function getNextQueueNumber(): Promise<number> {
  const [row] = await db
    .select({ maxNum: max(sessions.queueNumber) })
    .from(sessions);
  return (row?.maxNum ?? 0) + 1;
}
