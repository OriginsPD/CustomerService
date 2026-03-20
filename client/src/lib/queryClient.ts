import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30s default
      gcTime: 5 * 60 * 1000, // 5min cache
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Stable query key factory — all keys are typed arrays.
 * TanStack Query stores these in an in-memory Map, giving O(1) cache reads.
 */
export const queryKeys = {
  session: (id: string) => ["session", id] as const,
  queuePosition: (id: string) => ["queue", "position", id] as const,
  queue: () => ["queue", "list"] as const,
  activeQuestions: () => ["questions", "active"] as const,
  dashboardSummary: () => ["dashboard", "summary"] as const,
  trends: (days: number) => ["dashboard", "trends", days] as const,
  keywords: () => ["dashboard", "keywords"] as const,
  aiLog: (page: number) => ["ai", "log", page] as const,
  feedbackList: (page: number) => ["feedback", "list", page] as const,
  insights: () => ["dashboard", "insights"] as const,
};
