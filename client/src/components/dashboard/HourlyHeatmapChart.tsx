import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { GlossCard } from "@/components/shared/GlossCard";
import type { HourlyHeatmap } from "@vcc/shared";

export function HourlyHeatmapChart({ data }: { data: HourlyHeatmap[] }) {
  const formatted = data.map(d => ({
    ...d,
    time: `${d.hour}:00`
  }));

  return (
    <GlossCard>
      <h3 className="text-sm font-semibold gradient-text mb-4">Hourly Traffic</h3>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-56 text-muted-foreground text-sm">No data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "rgba(13,27,42,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#f1f5f9", fontSize: "12px" }}
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
            />
            <Bar dataKey="count" name="Check-ins" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </GlossCard>
  );
}
