import { useDashboardSummary, useTrends, useKeywords, useHourlyHeatmap, useSentimentByPurpose } from "@/hooks/useDashboard";

import { SentimentChart } from "../SentimentChart";
import { TrendLineChart } from "../TrendLineChart";
import { KeywordCloud } from "../KeywordCloud";
import { HourlyHeatmapChart } from "../HourlyHeatmapChart";
import { PurposeSentimentChart } from "../PurposeSentimentChart";
import { InsightsPanel } from "../InsightsPanel";
import { GlossCard } from "@/components/shared/GlossCard";
import { Brain } from "lucide-react";

export function AnalyticsSection() {
  const {
    data: summary,
    isLoading: summaryLoading,
  } = useDashboardSummary();
  const { data: trends = [], isLoading: trendsLoading } = useTrends(30);
  const { data: keywords = [], isLoading: keywordsLoading } = useKeywords();
  const { data: heatmap = [], isLoading: heatmapLoading } = useHourlyHeatmap();
  const { data: sentimentPurpose = [], isLoading: spLoading } = useSentimentByPurpose();

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
          {summary.lastAiRunAt && (
            <div className="flex items-center gap-2 mb-6 text-xs text-muted-foreground">
              <Brain className="h-3 w-3 text-cyan-400" />
              Last AI analysis:{" "}
              {new Date(summary.lastAiRunAt).toLocaleString()}
              <span className="text-muted-foreground/40">·</span>
              {summary.activeQuestionsCount} active questions
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <GlossCard className="flex flex-col gap-1 p-5 border-blue-500/20 shadow-blue-500/5 shadow-lg">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Avg Wait Time</span>
              <span className="text-2xl font-black gradient-text">
                {summary.avgWaitTimeMinutes}m
              </span>
            </GlossCard>
            <GlossCard className="flex flex-col gap-1 p-5 border-emerald-500/20 shadow-emerald-500/5 shadow-lg">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Avg Handle Time</span>
              <span className="text-2xl font-black text-emerald-400">
                {summary.avgHandleTimeMinutes}m
              </span>
            </GlossCard>
            <GlossCard className="flex flex-col gap-1 p-5 border-rose-500/20 shadow-rose-500/5 shadow-lg">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Abandonment Rate</span>
              <span className="text-2xl font-black text-rose-400">
                {summary.abandonmentRatePct}%
              </span>
            </GlossCard>
          </div>

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 my-4">
            {heatmapLoading ? (
               <GlossCard className="flex flex-col h-64 border-white/5">
                 <div className="h-4 w-32 shimmer rounded mb-6" />
                 <div className="flex-1 flex items-end gap-2">
                   {[...Array(12)].map((_, i) => (
                     <div key={i} className="flex-1 bg-white/5 rounded-t shimmer" style={{ height: `${Math.max(20, Math.random() * 100)}%` }} />
                   ))}
                 </div>
               </GlossCard>
            ) : (
               <HourlyHeatmapChart data={heatmap} />
            )}
            {spLoading ? (
               <GlossCard className="flex flex-col h-64 border-white/5">
                 <div className="h-4 w-40 shimmer rounded mb-6" />
                 <div className="flex-1 flex flex-col justify-between py-2">
                   {[...Array(4)].map((_, i) => (
                     <div key={i} className="flex items-center gap-3">
                       <div className="w-16 h-3 shimmer rounded" />
                       <div className="flex-1 h-6 bg-white/5 rounded shimmer" style={{ width: `${Math.max(40, Math.random() * 100)}%` }} />
                     </div>
                   ))}
                 </div>
               </GlossCard>
            ) : (
               <PurposeSentimentChart data={sentimentPurpose} />
            )}
          </div>

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
