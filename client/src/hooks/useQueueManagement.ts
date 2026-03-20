import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryClient";

export function useProcessClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => api.queue.processClient(sessionId),

    onSuccess: () => {
      // Refresh queue so the processed client disappears immediately
      queryClient.invalidateQueries({ queryKey: queryKeys.queue() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary() });
    },

    onError: (err: Error) => {
      toast.error("Failed to process client", { description: err.message });
    },
  });
}
