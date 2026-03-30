import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { GlossCard } from "@/components/shared/GlossCard";
import type { SentimentPurpose } from "@vcc/shared";

export function PurposeSentimentChart({ data }: { data: SentimentPurpose[] }) {
  return (
    <GlossCard>
      <h3 className="text-sm font-semibold gradient-text mb-4">Sentiment by Purpose</h3>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-56 text-muted-foreground text-sm">No data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="purpose" type="category" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
            <Tooltip
              contentStyle={{ background: "rgba(13,27,42,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#f1f5f9", fontSize: "12px" }}
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
            />
            <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
            <Bar dataKey="positive" stackId="a" fill="#10b981" name="Positive" radius={[0, 0, 0, 0]} />
            <Bar dataKey="neutral" stackId="a" fill="#3b82f6" name="Neutral" radius={[0, 0, 0, 0]} />
            <Bar dataKey="negative" stackId="a" fill="#f43f5e" name="Negative" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </GlossCard>
  );
}
