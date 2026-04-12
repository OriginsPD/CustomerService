import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryClient";
import type { QueueItem, Session } from "@vcc/shared";

export function useQueue() {
  return useQuery({
    queryKey: queryKeys.queue(),
    queryFn: () => api.queue.list() as Promise<QueueItem[]>,
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
    staleTime: 0,
    enabled: !!sessionId,
  });
}

export function useInProgressQueue() {
  return useQuery({
    queryKey: ["queue", "in-progress"],
    queryFn: () => api.queue.inProgress() as Promise<Session[]>,
  });
}
