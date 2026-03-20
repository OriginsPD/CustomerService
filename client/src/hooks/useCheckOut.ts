import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryClient";
import { MY_SESSION_KEY } from "@/lib/auth";
import type { CheckOutForm, FeedbackResponse } from "@vcc/shared";

export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CheckOutForm) =>
      api.checkOut.submit(data) as Promise<FeedbackResponse>,

    onSuccess: (_, variables) => {
      // Clear the device session so rescanning the QR shows a fresh form
      localStorage.removeItem(MY_SESSION_KEY);
      // Invalidate queue (session removed) and dashboard summary
      queryClient.invalidateQueries({ queryKey: queryKeys.queue() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary() });
      queryClient.removeQueries({
        queryKey: queryKeys.queuePosition(variables.sessionId),
      });
    },

    onError: (err: Error) => {
      toast.error("Feedback submission failed", { description: err.message });
    },
  });
}
