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
import { auth, MY_SESSION_KEY } from "@/lib/auth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ── Role detection ─────────────────────────────────────────────────────────────
//
// Three distinct user states drive nav rendering:
//  • staff     — JWT present (auth.isAuthenticated())
//  • client    — MY_SESSION_KEY present in localStorage (checked-in client)
//  • anonymous — neither (visitor who hasn't checked in yet)

function useRole() {
  const isStaff = auth.isAuthenticated();
  const hasSession = !!localStorage.getItem(MY_SESSION_KEY);
  if (isStaff) return "staff" as const;
  if (hasSession) return "client" as const;
  return "anonymous" as const;
}

// ── Route catalogue ────────────────────────────────────────────────────────────

const NAV = {
  checkIn: {
    to: "/check-in",
    label: "Check-In",
    icon: UserCheck,
    description: "Register a new visit",
  },
  queue: {
    to: "/queue",
    label: "Live Queue",
    icon: Users,
    description: "View your queue position",
  },
  dashboard: {
    to: "/staff/dashboard",
    label: "Dashboard",
    icon: BarChart3,
    description: "Analytics & queue mgmt",
  },
} as const;

// ── NavContent ────────────────────────────────────────────────────────────────

interface NavContentProps {
  onNavClick?: () => void;
}

function NavContent({ onNavClick }: NavContentProps) {
  const routerState = useRouterState();
  const navigate = useNavigate();
  const currentPath = routerState.location.pathname;
  const role = useRole();
  const staffSession = auth.getSession();

  // ── Per-role nav item lists ────────────────────────────────────────────────
  const navItems =
    role === "staff"
      ? [NAV.dashboard]          // staff: dashboard only
      : role === "client"
        ? [NAV.queue]             // client: queue only
        : [NAV.checkIn];          // anonymous: check-in only

  // ── Logout — always returns staff to login page ────────────────────────────
  const handleLogout = () => {
    auth.logout();
    onNavClick?.();
    navigate({ to: "/staff/login" });
  };

  return (
    <>
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/30 ring-1 ring-white/20">
          <Brain className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-base font-black gradient-text tracking-tight uppercase">VCC</p>
          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-[0.2em] -mt-0.5 opacity-70">
            Customer Care
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-3 mt-2 flex-1">
        {navItems.map((item) => {
          const isActive =
            currentPath === item.to ||
            currentPath.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 group",
                isActive
                  ? "bg-gradient-to-r from-blue-600/20 to-cyan-500/10 text-foreground gradient-border"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 flex-shrink-0 transition-colors",
                  isActive
                    ? "text-cyan-400"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <div>
                <p className="font-medium leading-none">{item.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: role-specific status strip */}
      <div className="p-3 border-t border-white/[0.06] space-y-2">

        {role === "staff" && (
          // ── Staff: username badge + sign-out ──────────────────────────────
          <>
          <>
            <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-3 shadow-inner">
              <div className="flex items-center gap-3 mb-3 px-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 shadow-sm">
                  <ShieldCheck className="h-4 w-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-foreground truncate">
                    {staffSession?.username ?? "Staff Admin"}
                  </p>
                  <p className="text-[10px] text-emerald-400/80 font-medium flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                    Session Active
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-[11px] font-semibold text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          </>
          </>
        )}

        {role === "client" && (
          // ── Client: "you're in queue" badge + kiosk QR shortcut ───────────
          <>
            <div className="glass-card px-3 py-2.5 flex items-center gap-2">
              <Ticket className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">
                  Session Active
                </p>
                <p className="text-[10px] text-muted-foreground">
                  You're checked in
                </p>
              </div>
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            </div>
            <Link
              to="/check-out/$sessionId"
              params={{ sessionId: localStorage.getItem(MY_SESSION_KEY) ?? "" }}
              onClick={onNavClick}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
            >
              <QrCode className="h-3.5 w-3.5" />
              Submit feedback &amp; leave
            </Link>
          </>
        )}

        {role === "anonymous" && (
          // ── Anonymous: system-online indicator + staff login link ──────────
          <>
            <div className="glass-card px-3 py-2.5 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs text-muted-foreground">System Online</span>
              <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AppShell({ children }: { children: React.ReactNode }) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Login page, kiosk, and home render without the sidebar — full-screen layouts
  if (currentPath === "/staff/login" || currentPath.startsWith("/kiosk") || currentPath === "/home") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">

      {/* ── Mobile top header (hidden on md+) ─────────────────────────────── */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-black/30 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/30">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <p className="text-sm font-bold gradient-text tracking-wide">VCC</p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* ── Mobile Sheet drawer ────────────────────────────────────────────── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <NavContent onNavClick={() => setDrawerOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* ── Desktop sidebar (hidden below md) ─────────────────────────────── */}
      <aside className="hidden md:flex w-64 flex-shrink-0 border-r border-white/[0.06] bg-black/30 backdrop-blur-xl flex-col">
        <NavContent />
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto min-w-0">{children}</main>
    </div>
  );
}
