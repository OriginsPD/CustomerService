import { useQuery, queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryClient";
import type { DynamicQuestion } from "@vcc/shared";

export const activeQuestionsQueryOptions = (sessionId?: string) =>
  queryOptions({
    queryKey: ["questions", "random", sessionId], // Unique key per session
    queryFn: () => api.questions.random() as Promise<DynamicQuestion[]>,
    staleTime: Infinity, // Keep them stable for this specific session
    gcTime: 10 * 60 * 1000, 
  });

export function useAIQuestions() {
  return useQuery(activeQuestionsQueryOptions());
}
