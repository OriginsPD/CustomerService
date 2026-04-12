import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Users, MessageSquareText, LayoutDashboard } from "lucide-react";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { StaffManagementPanel } from "@/components/dashboard/StaffManagementPanel";
import { TwilioSettingsPanel } from "@/components/dashboard/TwilioSettingsPanel";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/staff/admin")({
  beforeLoad: () => {
    if (!auth.isAuthenticated() || !auth.isSuperAdmin()) {
      throw redirect({ to: "/staff/login" });
    }
  },
  component: AdminDashboardPage,
});

type Tab = "staff" | "twilio";

function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("staff");
  const navigate = useNavigate();
  const session = auth.getSession();

  const tabs = [
    { id: "staff", label: "Staff Management", icon: Users },
    { id: "twilio", label: "Twilio Configuration", icon: MessageSquareText },
  ] as const;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-white/5 pb-8">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-600 to-amber-600 shadow-2xl shadow-amber-600/20 ring-1 ring-white/20">
            <ShieldCheck className="h-7 w-7 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-black tracking-tight gradient-text">
                System Administration
              </h1>
              <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                SuperAdmin
              </span>
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              Connected as <span className="text-foreground font-bold">{session?.fullName}</span> • Core Infrastructure Control
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate({ to: "/staff/dashboard" })}
            className="border-white/10 hover:bg-white/5 gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            Staff Dashboard
          </Button>
        </div>
      </div>

      {/* ── Navigation Tabs ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 p-1 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 w-fit">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                isActive
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon className={cn("h-4 w-4", isActive ? "text-black" : "text-amber-500/60")} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Content Area ────────────────────────────────────────────────────── */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
        {activeTab === "staff" && <StaffManagementPanel />}
        {activeTab === "twilio" && <TwilioSettingsPanel />}
      </div>
    </div>
  );
}
