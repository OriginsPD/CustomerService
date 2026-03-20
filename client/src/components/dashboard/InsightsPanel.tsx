import { AlertTriangle, CheckCircle2, Info, Loader2, Lightbulb } from "lucide-react";
import { useInsights } from "@/hooks/useDashboard";
import type { OperationalInsight } from "@vcc/shared";

const typeConfig: Record<
  OperationalInsight["type"],
  { icon: React.ElementType; color: string; bg: string; border: string }
> = {
  warning: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  success: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  info: {
    icon: Info,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
};

export function InsightsPanel() {
  const { data: insights, isLoading } = useInsights();

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-4 w-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-foreground">Operational Insights</h3>
        <span className="text-[10px] text-muted-foreground ml-auto">AI-generated</span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analysing metrics…
        </div>
      ) : !insights || insights.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No insights available yet — run an analysis or wait for more data.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {insights.map((insight, i) => {
            const { icon: Icon, color, bg, border } = typeConfig[insight.type];
            return (
              <div
                key={i}
                className={`flex gap-3 rounded-lg border p-3 ${bg} ${border}`}
              >
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-medium ${color}`}>{insight.title}</p>
                    {insight.metric && (
                      <span className="text-[11px] font-mono tabular-nums text-muted-foreground whitespace-nowrap">
                        {insight.metric}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
