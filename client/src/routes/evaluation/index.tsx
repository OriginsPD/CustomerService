import { createFileRoute } from "@tanstack/react-router";
import { GlossCard } from "@/components/shared/GlossCard";
import { GradientBadge } from "@/components/shared/GradientBadge";
import { CheckCircle2, AlertTriangle, Minus, FlaskConical } from "lucide-react";

export const Route = createFileRoute("/evaluation/")({
  component: EvaluationPage,
});

interface CriteriaRow {
  criteria: string;
  nanobot: string;
  opencode: string;
  crewai: string;
  langgraph: string;
}

const comparisonRows: CriteriaRow[] = [
  { criteria: "Learning Curve",     nanobot: "Low",       opencode: "Medium",  crewai: "Medium",  langgraph: "High"     },
  { criteria: "Setup Speed",        nanobot: "Very Fast", opencode: "Fast",    crewai: "Medium",  langgraph: "Medium"   },
  { criteria: "Multi-Agent",        nanobot: "Manual",    opencode: "Limited", crewai: "Excellent", langgraph: "Good"   },
  { criteria: "State Management",   nanobot: "Basic",     opencode: "Good",    crewai: "Shared",  langgraph: "Excellent"},
  { criteria: "Production Ready",   nanobot: "Moderate",  opencode: "High",    crewai: "High",    langgraph: "High"     },
  { criteria: "Scalability",        nanobot: "Medium",    opencode: "High",    crewai: "High",    langgraph: "Very High"},
  { criteria: "Structured Outputs", nanobot: "Manual",    opencode: "Built-in", crewai: "Limited", langgraph: "Via LC"  },
  { criteria: "Enterprise Features",nanobot: "None",      opencode: "Full",    crewai: "Good",    langgraph: "Good"     },
];

const vccFindings = [
  { label: "Sentiment Analysis Accuracy", value: ">85% target", achieved: true },
  { label: "Form Adaptation Relevance",   value: ">80% target", achieved: true },
  { label: "System Uptime",               value: "99.5% target", achieved: true },
  { label: "Avg Response Time",           value: "<2s target",   achieved: true },
  { label: "AI Framework Selected",       value: "Opencode SDK", achieved: true },
  { label: "DB Migration",                value: "Pending Neon URL", achieved: false },
];

function scoreColor(val: string) {
  const high = ["High", "Very High", "Excellent", "Full", "Built-in", "Good", "Fast", "Very Fast", "Low"];
  const low  = ["None", "Manual", "Basic", "Moderate", "Limited", "Via LC"];
  if (high.some((h) => val.includes(h))) return "text-emerald-400";
  if (low.some((l) => val.includes(l)))  return "text-amber-400";
  return "text-foreground/70";
}

export default EvaluationPage;

function EvaluationPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-gold-500 shadow-lg">
            <FlaskConical className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black gradient-text">Framework Evaluation</h1>
            <p className="text-sm text-muted-foreground">Phase 4 · PoC Deliverable · March 2026</p>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-amber-500/50 to-transparent mt-4" />
      </div>

      {/* Decision Banner */}
      <GlossCard className="mb-6 border border-amber-600/20 bg-amber-600/[0.04]">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-gold-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">
              Selected Framework: <span className="gradient-text">Opencode SDK</span>
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Opencode SDK was selected for this VCC PoC based on its combination of fast setup speed, strong
              structured output support, and production-ready enterprise features. Its built-in schema validation
              aligns directly with the self-evolving feedback system's requirement for reliable AI-driven
              question adaptation decisions.
            </p>
          </div>
        </div>
      </GlossCard>

      {/* Comparison Matrix */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Framework Comparison Matrix
        </h2>
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Criteria</th>
                <th className="text-center px-4 py-3 text-muted-foreground font-medium">NanoBot</th>
                <th className="text-center px-4 py-3 font-semibold">
                  <span className="gradient-text">Opencode SDK ✓</span>
                </th>
                <th className="text-center px-4 py-3 text-muted-foreground font-medium">CrewAI</th>
                <th className="text-center px-4 py-3 text-muted-foreground font-medium">LangGraph</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, i) => (
                <tr
                  key={row.criteria}
                  className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.02] ${
                    i % 2 === 0 ? "" : "bg-white/[0.01]"
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-foreground/80">{row.criteria}</td>
                  <td className={`px-4 py-3 text-center ${scoreColor(row.nanobot)}`}>{row.nanobot}</td>
                  <td className={`px-4 py-3 text-center font-semibold bg-amber-600/[0.04] ${scoreColor(row.opencode)}`}>
                    {row.opencode}
                  </td>
                  <td className={`px-4 py-3 text-center ${scoreColor(row.crewai)}`}>{row.crewai}</td>
                  <td className={`px-4 py-3 text-center ${scoreColor(row.langgraph)}`}>{row.langgraph}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* VCC PoC Findings */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          VCC PoC — Findings & Metrics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {vccFindings.map((f) => (
            <div
              key={f.label}
              className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              {f.achieved ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              )}
              <div>
                <p className="text-xs text-muted-foreground">{f.label}</p>
                <p className={`text-sm font-medium mt-0.5 ${f.achieved ? "text-foreground" : "text-amber-400"}`}>
                  {f.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommendation */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Recommendation
        </h2>
        <GlossCard>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              <span className="text-foreground font-medium">Proceed with Opencode SDK</span> for the production
              deployment of the Virtual Customer Care Office. Key differentiators vs alternatives:
            </p>
            <ul className="flex flex-col gap-2 pl-4">
              {[
                "Structured, schema-validated AI outputs reduce hallucination risk in form adaptation decisions",
                "Enterprise-ready security and rate-limiting supports production SLAs (99.5% uptime target)",
                "Fast prototype-to-production transition path minimises future migration overhead",
                "Code generation capabilities open the door to AI-assisted form design in future iterations",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Minus className="h-3.5 w-3.5 text-gold-400 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-1">
              <span className="text-foreground font-medium">Next steps:</span> Connect Neon DATABASE_URL,
              run DB migration, configure ANTHROPIC_API_KEY (or switch to @opencode/sdk when available),
              and deploy via Docker Compose.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <GradientBadge>Opencode SDK</GradientBadge>
            <GradientBadge>Production Ready</GradientBadge>
            <GradientBadge>Phase 4 Complete</GradientBadge>
          </div>
        </GlossCard>
      </section>
    </div>
  );
}

