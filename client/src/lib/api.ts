/**
 * Typed API client — wraps fetch with base URL and JSON handling.
 * Using a simple fetch wrapper keeps us framework-agnostic while
 * maintaining full TypeScript types from the shared Zod schemas.
 */

import { auth } from "./auth";

const BASE = "/api";

/** Error subclass that carries the HTTP status code for downstream handling */
export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new ApiError(res.status, (err as any).error ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/** Like request(), but attaches the staff JWT as a Bearer token.
 *
 * On 401 the stale token is cleared from localStorage so that
 * auth.isAuthenticated() returns false, which causes TanStack Router's
 * beforeLoad guard on /staff/dashboard to redirect to /staff/login on
 * the next navigation.  We do NOT force an immediate page redirect here
 * because that would log the staff member out mid-session even if the 401
 * was transient.  The mutation's onError handler shows a toast instead.
 */
async function staffRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = auth.getToken();
  try {
    return await request<T>(path, {
      ...options,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      // Clear the stale / expired token so the next navigation triggers
      // the beforeLoad guard and redirects to /staff/login.
      auth.logout();
    }
    throw err;
  }
}

export const api = {
  // Staff authentication
  auth: {
    login: (username: string, password: string) =>
      request<{ token: string; username: string; expiresIn: number }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify({ username, password }) }
      ),
  },

  // Check-In
  checkIn: {
    create: (body: unknown) =>
      request("/checkin", { method: "POST", body: JSON.stringify(body) }),
    getById: (id: string) => request(`/checkin/${id}`),
    updateStatus: (id: string, status: string) =>
      request(`/checkin/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    cancel: (
      id: string,
      feedback: { reason: string; wouldReschedule: boolean; additionalComment?: string }
    ) =>
      request(`/checkin/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify(feedback),
      }),
  },

  // Check-Out
  checkOut: {
    submit: (body: unknown) =>
      request("/checkout", { method: "POST", body: JSON.stringify(body) }),
    getBySession: (sessionId: string) =>
      request(`/checkout/${sessionId}`),
  },

  // Queue
  queue: {
    list: () => request("/queue"),
    depth: () => request("/queue/depth"),
    position: (sessionId: string) =>
      request(`/queue/position/${sessionId}`),
    /** Staff: mark client as processed, remove from live queue */
    processClient: (sessionId: string) =>
      staffRequest(`/queue/${sessionId}/process`, { method: "PATCH" }),
    /** Staff: fully Complete a processing client directly */
    completeClient: (sessionId: string) =>
      staffRequest(`/queue/${sessionId}/complete`, { method: "PATCH" }),
  },

  // Questions
  questions: {
    active: () => request("/questions/active"),
    random: () => request("/questions/random"),
    add: (body: { text: string; type?: string }) =>
      staffRequest("/questions", { method: "POST", body: JSON.stringify(body) }),
    deactivate: (id: string) =>
      staffRequest(`/questions/${id}/deactivate`, { method: "PATCH" }),
  },

  // Dashboard
  dashboard: {
    summary: () => request("/dashboard/summary"),
    trends: (days = 30) => request(`/dashboard/trends?days=${days}`),
    keywords: () => request("/dashboard/keywords"),
    aiLog: (page = 1, pageSize = 20) =>
      request(`/dashboard/ai-log?page=${page}&pageSize=${pageSize}`),
    insights: () => request("/dashboard/insights"),
    heatmap: () => request("/dashboard/heatmap"),
    sentimentPurpose: () => request("/dashboard/sentiment-purpose"),
  },

  // Feedback export
  feedback: {
    exportCsv: () =>
      fetch(`${BASE}/feedback/export`, {
        headers: { "Content-Type": "application/json" },
      }),
  },

  // Admin
  admin: {
    runAnalysis: () =>
      staffRequest("/admin/run-analysis", { method: "POST" }),
  },
};
