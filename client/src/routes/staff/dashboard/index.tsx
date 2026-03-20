import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
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
} from "lucide-react";
import { auth } from "@/lib/auth";
import { useDashboardSummary, useTrends, useKeywords } from "@/hooks/useDashboard";
import { OperationalMetrics } from "@/components/dashboard/OperationalMetrics";
import { SentimentChart } from "@/components/dashboard/SentimentChart";
import { TrendLineChart } from "@/components/dashboard/TrendLineChart";
import { KeywordCloud } from "@/components/dashboard/KeywordCloud";
import { AILogPanel } from "@/components/dashboard/AILogPanel";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { QueueManagementPanel } from "@/components/dashboard/QueueManagementPanel";
import { QuestionManagementPanel } from "@/components/dashboard/QuestionManagementPanel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { QRCodePanel } from "@/components/shared/QRCodePanel";
import { api } from "@/lib/api";
import { queryClient, queryKeys } from "@/lib/queryClient";
import { toast } from "sonner";

export const Route = createFileRoute("/staff/dashboard/")({
  // Auth guard — redirects unauthenticated visitors to the staff login page
  beforeLoad: () => {
    if (!auth.isAuthenticated()) {
      throw redirect({ to: "/staff/login" });
    }
  },
  component: StaffDashboardPage,
});

function StaffDashboardPage() {
  const navigate = useNavigate();
  const [aiLogOpen, setAiLogOpen] = useState(false);
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const session = auth.getSession();

  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useDashboardSummary();
  const { data: trends = [], isLoading: trendsLoading } = useTrends(30);
  const { data: keywords = [], isLoading: keywordsLoading } = useKeywords();

  const handleRunAnalysis = async () => {
    setIsRunningAnalysis(true);
    try {
      await api.admin.runAnalysis();
      queryClient.invalidateQueries({ queryKey: queryKeys.activeQuestions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary() });
      queryClient.invalidateQueries({ queryKey: queryKeys.aiLog(1) });
      refetchSummary();
    } catch (err) {
      console.error("Analysis failed:", err);
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
    } catch {
      toast.error("Export failed. Please try again.");
    }
  };

  return (
    <div className="p-4 md:p-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 gap-3 md:gap-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-black gradient-text">
              Staff Dashboard
            </h1>
            <span className="flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[11px] text-blue-300">
              <ShieldCheck className="h-3 w-3" />
              {session?.username ?? "Staff"}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            Manage the live queue and review customer analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQrOpen(true)}
          >
            <QrCode className="h-4 w-4" />
            Show QR
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAiLogOpen(true)}
          >
            <Brain className="h-4 w-4" />
            AI Logic
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunAnalysis}
            disabled={isRunningAnalysis}
          >
            {isRunningAnalysis ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Run Analysis
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetchSummary()}
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            title="Export feedback as CSV"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>

      {/* ── Live Queue Management ───────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Queue Management
        </h2>
        <QueueManagementPanel />
      </section>

      {/* ── Question Management ─────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Feedback Questions
        </h2>
        <QuestionManagementPanel />
      </section>

      {/* ── Analytics ──────────────────────────────────────────────────────── */}
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
            <div className="mb-6">
              <OperationalMetrics data={summary} />
            </div>

            {summary.lastAiRunAt && (
              <div className="flex items-center gap-2 mb-6 text-xs text-muted-foreground">
                <Brain className="h-3 w-3 text-cyan-400" />
                Last AI analysis:{" "}
                {new Date(summary.lastAiRunAt).toLocaleString()}
                <span className="text-muted-foreground/40">·</span>
                {summary.activeQuestionsCount} active questions
              </div>
            )}

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

      {/* AI Decision Log */}
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
