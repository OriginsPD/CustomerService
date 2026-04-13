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

/** Like request(), but attaches the staff JWT as a Bearer token. */
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
      auth.logout();
    }
    throw err;
  }
}

export const api = {
  // Staff authentication
  auth: {
    login: (username: string, password: string) =>
      request<{ 
        token: string; 
        username: string; 
        role: "superadmin" | "admin" | "agent";
        fullName: string;
        expiresIn: number 
      }>(
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
    inProgress: () => staffRequest("/queue/in-progress"),
    depth: () => request("/queue/depth"),
    position: (sessionId: string) =>
      request(`/queue/position/${sessionId}`),
    /** Staff: mark client as processed, remove from live queue */
    processClient: (sessionId: string) =>
      staffRequest(`/queue/${sessionId}/process`, { method: "PATCH" }),
  },

  // Questions
  questions: {
    active: () => request<any[]>("/questions/active"),
    session: (sessionId: string) => request<any[]>(`/questions/session/${sessionId}`),
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
    completeSession: (sessionId: string) =>
      staffRequest(`/admin/sessions/${sessionId}/complete`, { method: "PATCH" }),
    
    // SuperAdmin Staff Management
    listStaff: () =>
      staffRequest<{
        id: string;
        username: string;
        fullName: string;
        role: "superadmin" | "admin" | "agent";
        isActive: boolean;
        createdAt: string;
      }[]>("/admin/staff"),
    createStaff: (body: any) =>
      staffRequest<{ id: string }>("/admin/staff", { method: "POST", body: JSON.stringify(body) }),
    updateStaff: (id: string, body: any) =>
      staffRequest<{ success: boolean }>(`/admin/staff/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    deleteStaff: (id: string) =>
      staffRequest<{ success: boolean }>(`/admin/staff/${id}`, { method: "DELETE" }),
      
    // SuperAdmin Settings Management
    getSettings: (id: string) =>
      staffRequest<{
        id: string;
        config: any;
        updatedAt: string;
      }>(`/admin/settings/${id}`),
    updateSettings: (id: string, config: any) =>
      staffRequest<{ success: boolean }>(`/admin/settings/${id}`, { 
        method: "POST", 
        body: JSON.stringify({ config }) 
      }),
  },
};
