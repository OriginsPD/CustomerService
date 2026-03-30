import { EventEmitter } from "node:events";
import { db } from "../db/connection.js";
import { sessions, cancellationFeedback } from "../db/schema.js";
import { eq, max, desc, gte } from "drizzle-orm";
import { nanoid } from "nanoid";

// ── SSE event bus ─────────────────────────────────────────────────────────────
// SSE clients subscribe to "change" events to get instant queue updates.
export const queueEvents = new EventEmitter();
queueEvents.setMaxListeners(500); // support many concurrent staff connections

// ── In-memory O(1) queue map ──────────────────────────────────────────────────
// Maps sessionId → { queueNumber, lastSeenAt } for all currently "waiting" sessions.
// Initialized from DB on startup; updated on every check-in / check-out / heartbeat.

const queueMap = new Map<string, { queueNumber: number; lastSeenAt: number }>();

export let currentAvgServiceMinutes = 8;

export async function initQueueMap(): Promise<void> {
  const waiting = await db
    .select({ id: sessions.id, queueNumber: sessions.queueNumber })
    .from(sessions)
    .where(eq(sessions.status, "waiting"));

  queueMap.clear();
  const now = Date.now();
  for (const s of waiting) {
    queueMap.set(s.id, { queueNumber: s.queueNumber, lastSeenAt: now });
  }

  console.log(`[Queue] Initialized with ${queueMap.size} waiting session(s).`);
}

/** O(1) registration — called immediately after DB insert */
export function registerSession(sessionId: string, queueNumber: number): void {
  queueMap.set(sessionId, { queueNumber, lastSeenAt: Date.now() });
  queueEvents.emit("change");
}

/** O(1) heartbeat ping — called by client polling */
export function recordHeartbeat(sessionId: string): void {
  const session = queueMap.get(sessionId);
  if (session) {
    session.lastSeenAt = Date.now();
  }
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
  const myData = queueMap.get(sessionId); // O(1)
  if (!myData) return null;

  let position = 1;
  for (const { queueNumber } of queueMap.values()) {
    if (queueNumber < myData.queueNumber) position++;
  }
  return position;
}

export function getQueueDepth(): number {
  return queueMap.size;
}

export function getEstimatedWaitMinutes(sessionId: string): number {
  const position = getQueuePosition(sessionId);
  if (position === null) return 0;
  return (position - 1) * currentAvgServiceMinutes;
}

/** Returns all waiting sessions as an ordered array (for staff queue view) */
export function getOrderedQueue(): Array<{ sessionId: string; queueNumber: number }> {
  return Array.from(queueMap.entries())
    .map(([sessionId, data]) => ({ sessionId, queueNumber: data.queueNumber }))
    .sort((a, b) => a.queueNumber - b.queueNumber);
}

/**
 * Get next queue number — O(1) single MAX query using the existing index.
 * Monotonically increasing across all sessions (no daily reset to keep
 * queue numbers unique and easy to reference).
 */
export async function getNextQueueNumber(): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [row] = await db
    .select({ maxNum: max(sessions.queueNumber) })
    .from(sessions)
    .where(gte(sessions.checkedInAt, startOfDay));

  return (row?.maxNum ?? 0) + 1;
}

// ── Phase 5: Dynamic Queue Engine & Sweeper ─────────────────────────────────

export async function updateWaitEstimates() {
  try {
    const recent = await db.query.sessions.findMany({
      where: eq(sessions.status, "completed"),
      orderBy: [desc(sessions.checkedOutAt)],
      limit: 10,
    });
    if (recent.length > 1) {
      let totalServiceTime = 0;
      let validGaps = 0;
      for (let i = 0; i < recent.length - 1; i++) {
        if (recent[i].checkedOutAt && recent[i + 1].checkedOutAt) {
          const diffMs = recent[i].checkedOutAt!.getTime() - recent[i + 1].checkedOutAt!.getTime();
          // Filter out overnight gaps or anomalies (> 2 hours)
          if (diffMs > 0 && diffMs < 2 * 60 * 60 * 1000) {
            totalServiceTime += diffMs;
            validGaps++;
          }
        }
      }
      if (validGaps > 0) {
        const avgMins = Math.round(totalServiceTime / validGaps / 60000);
        if (avgMins > 0) {
          currentAvgServiceMinutes = avgMins;
        }
      }
    }
  } catch (err) {
    console.error("[QueueEngine] Wait estimates failed to update", err);
  }
}

export async function sweepNoShows() {
  try {
    const now = Date.now();
    for (const [id, data] of queueMap.entries()) {
      // 5 minutes (300,000 ms) without a ping = No Show
      if (now - data.lastSeenAt > 5 * 60 * 1000) {
        deregisterSession(id);
        await db.update(sessions)
          .set({ status: "cancelled" })
          .where(eq(sessions.id, id));
        
        await db.insert(cancellationFeedback).values({
          id: nanoid(),
          sessionId: id,
          reason: "Automated No-Show",
          wouldReschedule: false,
        });
        console.log(`[QueueEngine] Swept No-Show for waiting session: ${id}`);
      }
    }

    // Secondary sweep: clear any "in_progress" sessions that staff forgot to complete (> 4 hours)
    const inProgress = await db.query.sessions.findMany({
      where: eq(sessions.status, "in_progress"),
    });

    let sweptStale = false;
    for (const session of inProgress) {
      if (session.calledUpAt && now - session.calledUpAt.getTime() > 4 * 60 * 60 * 1000) {
        await db
          .update(sessions)
          .set({ status: "completed", checkedOutAt: new Date() })
          .where(eq(sessions.id, session.id));
        sweptStale = true;
        console.log(`[QueueEngine] Swept stale in_progress session: ${session.id}`);
      }
    }
    
    if (sweptStale) queueEvents.emit("change");

  } catch (err) {
    console.error("[QueueEngine] Heartbeat sweep failed", err);
  }
}

let engineInterval: NodeJS.Timeout | null = null;
export function startQueueEngine() {
  if (engineInterval) return;
  let tick = 0;
  engineInterval = setInterval(() => {
    sweepNoShows();
    if (tick % 5 === 0) updateWaitEstimates();
    tick++;
  }, 60 * 1000);
  
  updateWaitEstimates();
  console.log("[QueueEngine] Heartbeat sweeper and dynamic estimators started.");
}
