import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MY_SESSION_KEY } from "@/lib/auth";
import type { Session } from "@vcc/shared";

// ── Types ────────────────────────────────────────────────────────────────────

export type ResumeState =
  | { status: "none" }
  | {
      status: "active";
      session: Session;
      queuePosition: number;
      estimatedWaitMinutes: number;
    };

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Checks whether this device has a live session stored in localStorage.
 *
 * Flow:
 *  1. Read `MY_SESSION_KEY` from localStorage.
 *  2. If absent → { status: "none" }.
 *  3. Fetch GET /api/checkin/:id — on error / 404 → clear key → { status: "none" }.
 *  4. If session is "completed" or "cancelled" → clear key → { status: "none" }.
 *  5. Otherwise fetch current queue position and return { status: "active" }.
 *
 * `staleTime: 0` ensures it re-checks on every mount (each QR scan / page load).
 */
export function useSessionResume() {
  return useQuery({
    // Key changes when localStorage changes, so React Query re-runs the queryFn
    // automatically on any new mount after the key is set or cleared.
    queryKey: ["session", "resume", localStorage.getItem(MY_SESSION_KEY)],
    queryFn: async (): Promise<ResumeState> => {
      const sessionId = localStorage.getItem(MY_SESSION_KEY);

      if (!sessionId) return { status: "none" };

      // Verify session still exists & is active
      const session = await (api.checkIn.getById(sessionId) as Promise<Session>).catch(
        () => null
      );

      if (
        !session ||
        session.status === "completed" ||
        session.status === "cancelled"
      ) {
        localStorage.removeItem(MY_SESSION_KEY);
        return { status: "none" };
      }

      // Fetch live queue position (best-effort — fall back gracefully)
      const pos = await (
        api.queue.position(sessionId) as Promise<{
          queuePosition: number;
          estimatedWaitMinutes: number;
        }>
      ).catch(() => null);

      return {
        status: "active",
        session,
        queuePosition: pos?.queuePosition ?? 1,
        estimatedWaitMinutes: pos?.estimatedWaitMinutes ?? 0,
      };
    },
    staleTime: 0,      // Always re-check on mount
    retry: false,      // Don't retry — treat any error as "no session"
    gcTime: 0,         // Don't cache stale results between mounts
  });
}

/**
 * Returns a function that clears the session from localStorage and
 * invalidates the resume query so the check-in page re-renders to
 * the fresh form immediately.
 */
export function useClearSession() {
  const queryClient = useQueryClient();

  return () => {
    localStorage.removeItem(MY_SESSION_KEY);
    queryClient.invalidateQueries({ queryKey: ["session", "resume"] });
  };
}
