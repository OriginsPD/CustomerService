import { useState } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  UserCheck,
  Users,
  BarChart3,
  Brain,
  Activity,
  LogIn,
  LogOut,
  ShieldCheck,
  FlaskConical,
  Menu,
  QrCode,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth, MY_SESSION_KEY, DAY_SESSION_KEY } from "@/lib/auth";
import { useQueueStream } from "@/hooks/useQueueStream";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ── Role detection ─────────────────────────────────────────────────────────────
function useRole() {
  const isStaff = auth.isAuthenticated();
  const hasSession = !!localStorage.getItem(MY_SESSION_KEY);
  if (isStaff) return "staff" as const;
  if (hasSession) return "client" as const;
  return "anonymous" as const;
}

const NAV = {
  checkIn: { to: "/check-in", label: "Check-In", icon: UserCheck },
  queue: { to: "/queue", label: "Live Queue", icon: Users },
  dashboard: { to: "/staff/dashboard", label: "Dashboard", icon: BarChart3 },
  admin: { to: "/staff/dashboard/admin", label: "Admin", icon: ShieldCheck },
} as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const routerState = useRouterState();
  const navigate = useNavigate();
  const currentPath = routerState.location.pathname;
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Connect explicitly to the server's SSE emitter
  useQueueStream();
  
  const role = useRole();
  const staffSession = auth.getSession();
  const hasDayPass = !!localStorage.getItem(DAY_SESSION_KEY);

  const navItems =
    role === "staff"
      ? auth.isSuperAdmin() 
        ? [NAV.dashboard, NAV.admin]
        : [NAV.dashboard]
      : role === "client"
        ? [NAV.queue]
        : [NAV.checkIn];

  const handleLogout = () => {
    auth.logout();
    setDrawerOpen(false);
    navigate({ to: "/staff/login" });
  };

  const handleEndDayPass = () => {
    localStorage.removeItem(DAY_SESSION_KEY);
    localStorage.removeItem(MY_SESSION_KEY);
    setDrawerOpen(false);
    navigate({ to: "/kiosk" });
  };

  // Login page and kiosk render without the top nav / shell
  if (currentPath === "/staff/login" || currentPath.startsWith("/kiosk")) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      {/* ── Ambient Background Glows ────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 flex justify-center z-[-1] overflow-hidden">
        <div className="absolute -top-[10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-blue-600/10 mix-blend-screen blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-cyan-500/10 mix-blend-screen blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[20%] h-[400px] w-[600px] rounded-full bg-indigo-500/10 mix-blend-screen blur-[120px]" />
      </div>

      {/* ── Desktop Top Navigation (hidden below md) ────────────────────────── */}
      <header className="hidden md:flex items-center justify-between px-6 py-3 border-b border-white/[0.08] bg-black/40 backdrop-blur-2xl sticky top-0 z-40">
        <div className="flex items-center gap-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/30">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold gradient-text tracking-wide">VCC</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                Customer Care
              </p>
            </div>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = currentPath === item.to || currentPath.startsWith(item.to + "/");
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 group hover-lift",
                    isActive
                      ? "bg-gradient-to-r from-blue-600/20 to-cyan-500/10 text-foreground shadow-[inset_0_1px_rgba(255,255,255,0.1)] border border-white/5"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-cyan-400" : "group-hover:text-cyan-400")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Status Actions */}
        <div className="flex items-center gap-4">
          {role === "staff" && (
            <div className="flex items-center gap-3">
              <div className="glass-card px-3 py-1.5 flex items-center gap-2 rounded-full border-blue-500/30">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs font-semibold">{staffSession?.username ?? "Staff"}</span>
              </div>
              <button onClick={handleLogout} className="text-xs font-medium text-muted-foreground hover:text-rose-400 transition-colors flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-rose-500/10">
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          )}

          {role === "client" && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs text-muted-foreground">Session Active</span>
              </div>
              <Link to="/check-out/$sessionId" params={{ sessionId: localStorage.getItem(MY_SESSION_KEY) ?? "" }} className="text-xs font-medium text-muted-foreground hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                <QrCode className="h-3.5 w-3.5" /> Check Out
              </Link>
              {hasDayPass && (
                <button onClick={handleEndDayPass} className="text-xs font-medium text-muted-foreground hover:text-orange-400 transition-colors flex items-center gap-1.5 px-2 py-1 flex items-center rounded-md hover:bg-orange-500/10">
                  <LogOut className="h-3.5 w-3.5" /> End Pass
                </button>
              )}
            </div>
          )}

          {role === "anonymous" && (
             <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                 <span className="text-xs text-muted-foreground">Online</span>
               </div>
               {hasDayPass && (
                 <button onClick={handleEndDayPass} className="text-xs font-medium text-muted-foreground hover:text-orange-400 transition-colors flex items-center gap-1.5 px-2 py-1 flex items-center rounded-md hover:bg-orange-500/10">
                   <LogOut className="h-3.5 w-3.5" /> End Pass
                 </button>
               )}
               <Link to="/staff/login" className="text-xs font-medium text-muted-foreground hover:text-blue-400 transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-blue-500/10">
                 <LogIn className="h-3.5 w-3.5" /> Staff Login
               </Link>
             </div>
          )}
        </div>
      </header>

      {/* ── Mobile top header (hidden on md+) ─────────────────────────────── */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-black/40 backdrop-blur-2xl sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/30">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <p className="text-sm font-bold gradient-text tracking-wide">VCC</p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* ── Mobile Sheet drawer ────────────────────────────────────────────── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col bg-black/90 backdrop-blur-2xl border-white/10">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 p-4 mt-6 flex-1">
            {navItems.map((item) => {
              const isActive = currentPath === item.to || currentPath.startsWith(item.to + "/");
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setDrawerOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-all duration-150",
                    isActive
                      ? "bg-gradient-to-r from-blue-600/20 to-cyan-500/10 text-foreground border border-white/5"
                      : "text-muted-foreground hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-cyan-400" : "")} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
          
          <div className="p-4 border-t border-white/10 space-y-2">
            {role === "staff" && (
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-400 bg-rose-500/10 transition-colors">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            )}
            {role === "client" && (
              <>
                <Link to="/check-out/$sessionId" params={{ sessionId: localStorage.getItem(MY_SESSION_KEY) ?? "" }} onClick={() => setDrawerOpen(false)} className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-cyan-400 bg-cyan-500/10 transition-colors">
                  <QrCode className="h-4 w-4" /> Check Out Feedback
                </Link>
                {hasDayPass && (
                  <button onClick={handleEndDayPass} className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-orange-400 bg-orange-500/10 transition-colors">
                    <LogOut className="h-4 w-4" /> End Day Pass
                  </button>
                )}
              </>
            )}
            {role === "anonymous" && (
              <>
                 {hasDayPass && (
                  <button onClick={handleEndDayPass} className="w-full mb-2 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-orange-400 bg-orange-500/10 transition-colors">
                    <LogOut className="h-4 w-4" /> End Day Pass
                  </button>
                )}
                <Link to="/staff/login" onClick={() => setDrawerOpen(false)} className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-400 bg-blue-500/10 transition-colors">
                  <LogIn className="h-4 w-4" /> Staff Login
                </Link>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Main content wrapper ──────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto min-w-0 flex flex-col items-center">
        <div className="w-full max-w-screen-2xl">
          {children}
        </div>
      </main>
    </div>
  );
}
