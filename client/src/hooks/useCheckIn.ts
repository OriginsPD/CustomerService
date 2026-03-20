import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryClient";
import type { CheckInForm, CheckInResponse } from "@vcc/shared";

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CheckInForm) =>
      api.checkIn.create(data) as Promise<CheckInResponse>,

    onSuccess: (response) => {
      // Pre-populate session cache — O(1) Map write
      queryClient.setQueryData(
        queryKeys.session(response.sessionId),
        response
      );
      // Invalidate queue list so staff view refreshes
      queryClient.invalidateQueries({ queryKey: queryKeys.queue() });
    },

    onError: (err: Error) => {
      toast.error("Check-in failed", { description: err.message });
    },
  });
}
