import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from "recharts";
import { GlossCard } from "@/components/shared/GlossCard";
import { formatDate } from "@/lib/utils";
import type { TrendPoint } from "@vcc/shared";

interface TrendLineChartProps {
  data: TrendPoint[];
}

export function TrendLineChart({ data }: TrendLineChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    date: formatDate(d.date),
    avgRating: Number(d.avgRating.toFixed(1)),
  }));

  const empty = data.length === 0;

  return (
    <GlossCard>
      <h3 className="text-sm font-semibold gradient-text mb-4">
        Satisfaction Trends (Last 30 Days)
      </h3>

      {empty ? (
        <div className="flex items-center justify-center h-56 text-muted-foreground text-sm">
          Not enough data yet — submit feedback to see trends
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              domain={[0, 5]}
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(13,27,42,0.95)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                color: "#f1f5f9",
                fontSize: "12px",
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="avgRating"
              name="Avg Rating (1–5)"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#06b6d4", stroke: "transparent" }}
              style={{ filter: "drop-shadow(0 0 4px #06b6d460)" }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="visitCount"
              name="Visit Count"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="4 2"
              dot={false}
              activeDot={{ r: 4, fill: "#3b82f6", stroke: "transparent" }}
              style={{ filter: "drop-shadow(0 0 4px #3b82f660)" }}
            />
            {formatted.length > 14 && (
              <Brush
                dataKey="date"
                height={20}
                stroke="rgba(59,130,246,0.3)"
                fill="rgba(255,255,255,0.02)"
                travellerWidth={6}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}
    </GlossCard>
  );
}
