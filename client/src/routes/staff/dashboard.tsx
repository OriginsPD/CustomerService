import { createFileRoute, redirect, useNavigate, Outlet, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Brain,
  RefreshCw,
  Loader2,
  Zap,
  LogOut,
  ShieldCheck,
  Download,
  QrCode,
  Users,
  MessageSquare,
  BarChart3,
  Clock,
  TrendingUp,
  Monitor,
  Percent,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { useDashboardSummary } from "@/hooks/useDashboard";
import { Button } from "@/components/ui/button";
import { GlossCard } from "@/components/shared/GlossCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { QRCodePanel } from "@/components/shared/QRCodePanel";
import { AILogPanel } from "@/components/dashboard/AILogPanel";
import { api } from "@/lib/api";
import { queryClient, queryKeys } from "@/lib/queryClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/staff/dashboard")({
  beforeLoad: () => {
    if (!auth.isAuthenticated()) {
      throw redirect({ to: "/staff/login" });
    }
  },
  component: StaffDashboardLayout,
});

function StaffDashboardLayout() {
  const navigate = useNavigate();
  const [aiLogOpen, setAiLogOpen] = useState(false);
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const session = auth.getSession();
  const { data: summary, refetch: refetchSummary } = useDashboardSummary();

  const handleRunAnalysis = async () => {
    setIsRunningAnalysis(true);
    try {
      await api.admin.runAnalysis();
      queryClient.invalidateQueries({ queryKey: queryKeys.activeQuestions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary() });
      queryClient.invalidateQueries({ queryKey: queryKeys.aiLog(1) });
      refetchSummary();
      toast.success("Analysis triggered successfully");
    } catch (err) {
      console.error("Analysis failed:", err);
      toast.error("Failed to run analysis");
    } finally {
      setIsRunningAnalysis(false);
    }
  };

  const handleLogout = () => {
    auth.logout();
    navigate({ to: "/staff/login" });
  };

  const handleExportCsv = async () => {
    try {
      const res = await api.feedback.exportCsv();
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vcc-feedback-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export successful");
    } catch {
      toast.error("Export failed. Please try again.");
    }
  };

  const navItems = [
    { label: "Live Queue", to: "/staff/dashboard/queue", icon: Users },
    { label: "Analytics", to: "/staff/dashboard/analytics", icon: BarChart3 },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 gap-3 md:gap-0 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-black gradient-text">
              Staff Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Manage the live queue and review customer analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
          <div className="flex items-center gap-1.5 mr-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-white"
              onClick={() => refetchSummary()}
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <div className="h-4 w-px bg-white/10 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-white gap-1.5"
              onClick={handleExportCsv}
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={() => setQrOpen(true)} className="h-9">
            <QrCode className="h-4 w-4" />
            Show QR
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAiLogOpen(true)} className="h-9">
            <Brain className="h-4 w-4" />
            AI Logic
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleRunAnalysis}
            disabled={isRunningAnalysis}
            className="h-9 bg-blue-600 hover:bg-blue-500 text-white border-none shadow-lg shadow-blue-500/20"
          >
            {isRunningAnalysis ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Run Analysis
          </Button>
        </div>
      </div>

      {/* ── Quick Stats ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Visits Today"
          value={summary?.totalVisitsToday ?? 0}
          icon={Users}
          trend={summary?.totalVisitsToday ? "+12%" : undefined}
          color="text-blue-400"
        />
        <StatCard
          label="Avg Wait"
          value={summary?.avgWaitTimeMinutes ? `${summary.avgWaitTimeMinutes}m` : "—"}
          icon={Clock}
          color="text-cyan-400"
        />
        <StatCard
          label="Avg Handle"
          value={summary?.avgHandleTimeMinutes ? `${summary.avgHandleTimeMinutes}m` : "—"}
          icon={Monitor}
          color="text-purple-400"
        />
        <StatCard
          label="Satisfaction"
          value={summary?.avgRatingToday ? `${summary.avgRatingToday.toFixed(1)}/5` : "—"}
          icon={TrendingUp}
          color="text-emerald-400"
        />
      </div>

      {/* ── Navigation Tabs ─────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-8 p-1 bg-white/5 rounded-xl w-fit">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeProps={{ className: "bg-white/10 text-white shadow-sm" }}
            inactiveProps={{ className: "text-muted-foreground hover:text-white hover:bg-white/5" }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </div>

      {/* ── Section Content ─────────────────────────────────────────────────── */}
      <main className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <Outlet />
      </main>

      {/* AI Decision Log Overlay */}
      <AILogPanel open={aiLogOpen} onClose={() => setAiLogOpen(false)} />

      {/* ── QR Code Dialog ──────────────────────────────────────────────── */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Client Check-In QR Code</DialogTitle>
            <DialogDescription>
              Display this on a screen or share the link so clients can scan to
              check in. Open{" "}
              <span className="font-mono text-xs text-foreground">
                /kiosk
              </span>{" "}
              on a dedicated display for a full-screen version.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <QRCodePanel />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color,
}: {
  label: string;
  value: string | number;
  icon: any;
  trend?: string;
  color: string;
}) {
  return (
    <GlossCard className="py-4 px-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="text-2xl font-black gradient-text tabular-nums leading-none">
            {value}
          </p>
          {trend && (
            <p className="text-[10px] text-emerald-400 mt-1.5 font-medium flex items-center gap-1">
              <TrendingUp className="h-2.5 w-2.5" />
              {trend} vs yesterday
            </p>
          )}
        </div>
        <div className={cn("p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]", color)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </GlossCard>
  );
}
