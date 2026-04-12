import { GlossCard } from "@/components/shared/GlossCard";
import { cn } from "@/lib/utils";
import type { Keyword } from "@vcc/shared";

const sentimentColors: Record<string, { text: string; bg: string; border: string }> = {
  positive: {
    text: "text-gold-400",
    bg: "bg-gold-500/10",
    border: "border-gold-500/30",
  },
  neutral: {
    text: "text-amber-400",
    bg: "bg-amber-600/10",
    border: "border-amber-600/30",
  },
  negative: {
    text: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
  },
};

interface KeywordCloudProps {
  data: Keyword[];
}

export function KeywordCloud({ data }: KeywordCloudProps) {
  const empty = data.length === 0;

  // Normalise sizes: largest word gets font-size 1.6rem, smallest gets 0.75rem
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const minCount = Math.min(...data.map((d) => d.count), 1);
  const range = maxCount - minCount || 1;

  function fontSize(count: number): string {
    const normalized = (count - minCount) / range; // 0 → 1
    const size = 0.75 + normalized * 0.85; // 0.75rem → 1.6rem
    return `${size.toFixed(2)}rem`;
  }

  return (
    <GlossCard>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold gradient-text">Keyword Frequency</h3>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {Object.entries(sentimentColors).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1">
              <span className={cn("inline-block h-2 w-2 rounded-full", v.bg, `border ${v.border}`)} />
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </span>
          ))}
        </div>
      </div>

      {empty ? (
        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
          Keyword analysis will appear after feedback is submitted
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 items-center min-h-[8rem]">
          {data.map((keyword) => {
            const colors = sentimentColors[keyword.sentiment] ?? sentimentColors.neutral;
            return (
              <span
                key={keyword.word}
                className={cn(
                  "inline-flex items-center rounded-lg border px-2.5 py-1 font-semibold transition-all hover:scale-105 cursor-default",
                  colors.bg,
                  colors.border,
                  colors.text
                )}
                style={{ fontSize: fontSize(keyword.count) }}
                title={`${keyword.word}: ${keyword.count} mention${keyword.count !== 1 ? "s" : ""}`}
              >
                {keyword.word}
                <span className="ml-1.5 text-[0.65rem] opacity-60 tabular-nums">
                  {keyword.count}
                </span>
              </span>
            );
          })}
        </div>
      )}
    </GlossCard>
  );
}

