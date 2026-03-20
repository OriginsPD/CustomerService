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
} from "lucide-react";
import { auth } from "@/lib/auth";
import { useDashboardSummary } from "@/hooks/useDashboard";
import { Button } from "@/components/ui/button";
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
  const { refetch: refetchSummary } = useDashboardSummary();

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
    { label: "Questions", to: "/staff/dashboard/questions", icon: MessageSquare },
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
          <Button variant="outline" size="sm" onClick={() => setQrOpen(true)}>
            <QrCode className="h-4 w-4" />
            Show QR
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAiLogOpen(true)}>
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
