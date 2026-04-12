import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Users, Settings, MessageSquareText } from "lucide-react";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { GlossCard } from "@/components/shared/GlossCard";
import { cn } from "@/lib/utils";
import { StaffManagementPanel } from "@/components/dashboard/StaffManagementPanel";
import { TwilioSettingsPanel } from "@/components/dashboard/TwilioSettingsPanel";

export const Route = createFileRoute("/staff/dashboard/admin")({
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

  const tabs = [
    { id: "staff", label: "Staff Management", icon: Users },
    { id: "twilio", label: "Twilio Configuration", icon: MessageSquareText },
  ] as const;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 shadow-xl shadow-indigo-500/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight gradient-text">
              SuperAdmin Control
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Manage system identity, permissions, and service integrations
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 w-fit">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-white/10 text-white shadow-lg border border-white/10"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon className={cn("h-4 w-4", isActive ? "text-indigo-400" : "")} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === "staff" && <StaffManagementPanel />}
        {activeTab === "twilio" && <TwilioSettingsPanel />}
      </div>
    </div>
  );
}
