import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryClient";
import { MY_SESSION_KEY } from "@/lib/auth";

interface CancelPayload {
  sessionId: string;
  reason: string;
  wouldReschedule: boolean;
  additionalComment?: string;
}

export function useCancelCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, reason, wouldReschedule, additionalComment }: CancelPayload) =>
      api.checkIn.cancel(sessionId, { reason, wouldReschedule, additionalComment }),

    onSuccess: (_, { sessionId }) => {
      // Clear the stored customer session so the queue page no longer shows cancel
      localStorage.removeItem(MY_SESSION_KEY);
      // Refresh queue for all watchers
      queryClient.invalidateQueries({ queryKey: queryKeys.queue() });
      queryClient.removeQueries({ queryKey: queryKeys.session(sessionId) });
    },

    onError: (err: Error) => {
      toast.error("Cancellation failed", { description: err.message });
    },
  });
}
