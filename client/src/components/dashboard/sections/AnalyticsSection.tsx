import { useDashboardSummary, useTrends, useKeywords } from "@/hooks/useDashboard";
import { OperationalMetrics } from "../OperationalMetrics";
import { SentimentChart } from "../SentimentChart";
import { TrendLineChart } from "../TrendLineChart";
import { KeywordCloud } from "../KeywordCloud";
import { InsightsPanel } from "../InsightsPanel";
import { Brain } from "lucide-react";

export function AnalyticsSection() {
  const {
    data: summary,
    isLoading: summaryLoading,
  } = useDashboardSummary();
  const { data: trends = [], isLoading: trendsLoading } = useTrends(30);
  const { data: keywords = [], isLoading: keywordsLoading } = useKeywords();

  return (
    <section>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Analytics
      </h2>

      {summaryLoading ? (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card h-24 shimmer" />
          ))}
        </div>
      ) : summary ? (
        <>
          <div className="mb-6">
            <OperationalMetrics data={summary} />
          </div>

          {summary.lastAiRunAt && (
            <div className="flex items-center gap-2 mb-6 text-xs text-muted-foreground">
              <Brain className="h-3 w-3 text-cyan-400" />
              Last AI analysis:{" "}
              {new Date(summary.lastAiRunAt).toLocaleString()}
              <span className="text-muted-foreground/40">·</span>
              {summary.activeQuestionsCount} active questions
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-4">
            <SentimentChart data={summary.sentimentDistribution} />
            <div className="lg:col-span-2">
              {trendsLoading ? (
                <div className="glass-card h-64 shimmer" />
              ) : (
                <TrendLineChart data={trends} />
              )}
            </div>
          </div>

          {keywordsLoading ? (
            <div className="glass-card h-48 shimmer" />
          ) : (
            <KeywordCloud data={keywords} />
          )}

          <div className="mt-4">
            <InsightsPanel />
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          No analytics data available yet
        </div>
      )}
    </section>
  );
}
