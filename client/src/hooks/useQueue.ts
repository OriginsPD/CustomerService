import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryClient";
import type { QueueItem } from "@vcc/shared";

export function useQueue() {
  return useQuery({
    queryKey: queryKeys.queue(),
    queryFn: () => api.queue.list() as Promise<QueueItem[]>,
    refetchInterval: 60_000, // Fallback poll — SSE (useQueueStream) handles real-time updates
    staleTime: 0,
  });
}

export function useQueuePosition(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.queuePosition(sessionId),
    queryFn: () =>
      api.queue.position(sessionId) as Promise<{
        sessionId: string;
        queuePosition: number;
        estimatedWaitMinutes: number;
      }>,
    refetchInterval: 15_000,
    staleTime: 0,
    enabled: !!sessionId,
  });
}
