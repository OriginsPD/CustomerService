import { Users, Star, Activity, ThumbsUp } from "lucide-react";
import { GlossCard } from "@/components/shared/GlossCard";
import type { DashboardSummary } from "@vcc/shared";

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  iconColor?: string;
}

function MetricCard({ icon: Icon, label, value, sub, iconColor = "text-amber-400" }: MetricCardProps) {
  return (
    <GlossCard className="flex items-center gap-4">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/[0.06]">
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wider truncate">
          {label}
        </p>
        <p className="text-2xl font-black gradient-text tabular-nums leading-tight">
          {value}
        </p>
        {sub && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
        )}
      </div>
    </GlossCard>
  );
}

interface OperationalMetricsProps {
  data: DashboardSummary;
}

export function OperationalMetrics({ data }: OperationalMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <MetricCard
        icon={Users}
        label="Visits Today"
        value={data.totalVisitsToday}
        sub={`${data.totalVisitsAllTime} all time`}
        iconColor="text-amber-400"
      />
      <MetricCard
        icon={Star}
        label="Avg Rating Today"
        value={
          data.avgRatingToday > 0
            ? `${data.avgRatingToday.toFixed(1)} ★`
            : "—"
        }
        sub={`${data.avgRating.toFixed(1)} ★ all time`}
        iconColor="text-gold-400"
      />
      <MetricCard
        icon={Activity}
        label="Queue Depth"
        value={data.currentQueueDepth}
        sub="clients waiting now"
        iconColor="text-amber-400"
      />
      <MetricCard
        icon={ThumbsUp}
        label="Positive Sentiment"
        value={`${data.positiveSentimentPct}%`}
        sub={`${data.sentimentDistribution.total} rated`}
        iconColor="text-gold-400"
      />
    </div>
  );
}

