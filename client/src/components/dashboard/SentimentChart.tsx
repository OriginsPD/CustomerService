import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { GlossCard } from "@/components/shared/GlossCard";
import type { SentimentDistribution } from "@vcc/shared";

const COLORS = {
  positive: "#06b6d4",
  neutral: "#3b82f6",
  negative: "#f43f5e",
};

interface SentimentChartProps {
  data: SentimentDistribution;
}

export function SentimentChart({ data }: SentimentChartProps) {
  const chartData = [
    { name: "Positive", value: data.positive, color: COLORS.positive },
    { name: "Neutral", value: data.neutral, color: COLORS.neutral },
    { name: "Negative", value: data.negative, color: COLORS.negative },
  ].filter((d) => d.value > 0);

  const empty = chartData.length === 0;

  return (
    <GlossCard>
      <h3 className="text-sm font-semibold gradient-text mb-4">
        Sentiment Distribution
      </h3>

      {empty ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No feedback data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  stroke="transparent"
                  style={{ filter: `drop-shadow(0 0 6px ${entry.color}60)` }}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "rgba(13,27,42,0.95)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                color: "#f1f5f9",
                fontSize: "12px",
              }}
              formatter={(value: number, name: string) => [
                `${value} (${data.total > 0 ? Math.round((value / data.total) * 100) : 0}%)`,
                name,
              ]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </GlossCard>
  );
}
