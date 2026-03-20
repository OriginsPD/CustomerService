import { useQuery, queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryClient";
import type { DynamicQuestion } from "@vcc/shared";

export const activeQuestionsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.activeQuestions(),
    queryFn: () => api.questions.active() as Promise<DynamicQuestion[]>,
    staleTime: 5 * 60 * 1000,  // 5 min — questions change at most once per 24h
    gcTime: 30 * 60 * 1000,
  });

export function useAIQuestions() {
  return useQuery(activeQuestionsQueryOptions());
}
