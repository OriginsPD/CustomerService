import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryClient";
import type {
  DashboardSummary,
  TrendPoint,
  Keyword,
  OperationalInsight,
  HourlyHeatmap,
  SentimentPurpose,
} from "@vcc/shared";

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboardSummary(),
    queryFn: () => api.dashboard.summary() as Promise<DashboardSummary>,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // refresh every minute
  });
}

export function useTrends(days = 30) {
  return useQuery({
    queryKey: queryKeys.trends(days),
    queryFn: () => api.dashboard.trends(days) as Promise<TrendPoint[]>,
    staleTime: 5 * 60 * 1000,
  });
}

export function useHourlyHeatmap() {
  return useQuery({
    queryKey: ["dashboard", "heatmap"],
    queryFn: () => api.dashboard.heatmap() as Promise<HourlyHeatmap[]>,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSentimentByPurpose() {
  return useQuery({
    queryKey: ["dashboard", "sentimentPurpose"],
    queryFn: () => api.dashboard.sentimentPurpose() as Promise<SentimentPurpose[]>,
    staleTime: 5 * 60 * 1000,
  });
}

export function useKeywords() {
  return useQuery({
    queryKey: queryKeys.keywords(),
    queryFn: () => api.dashboard.keywords() as Promise<Keyword[]>,
    staleTime: 10 * 60 * 1000,
  });
}

export function useInsights() {
  return useQuery({
    queryKey: queryKeys.insights(),
    queryFn: () => api.dashboard.insights() as Promise<OperationalInsight[]>,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAILog(page = 1) {
  return useQuery({
    queryKey: queryKeys.aiLog(page),
    queryFn: () =>
      api.dashboard.aiLog(page) as Promise<{
        data: Array<{
          id: string;
          runAt: string;
          action: string;
          questionId: string | null;
          questionText: string | null;
          reasoning: string;
          feedbackSampleSize: number;
          confidenceLevel: number | null;
        }>;
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
      }>,
    staleTime: 60 * 1000,
  });
}
