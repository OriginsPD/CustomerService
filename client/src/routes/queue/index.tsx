import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueue } from "@/hooks/useQueue";
import { GlossCard } from "@/components/shared/GlossCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Users,
  RefreshCw,
  Wifi,
  XCircle,
  Bell,
  ClipboardList,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { CancellationFeedbackModal } from "@/components/check-in/CancellationFeedbackModal";
import { MY_SESSION_KEY } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Session } from "@vcc/shared";

export const Route = createFileRoute("/queue/")({
  // Require an active client session. Sessionless visitors (including
  // anyone who hasn't scanned the QR yet) are redirected to the kiosk.
  beforeLoad: () => {
    if (!localStorage.getItem(MY_SESSION_KEY)) {
      throw redirect({ to: "/kiosk" });
    }
  },
  component: QueuePage,
});

function QueuePage() {
  const navigate = useNavigate();
  const { data: queue = [], isLoading, dataUpdatedAt } = useQueue();
  const [mySessionId, setMySessionId] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  // Read the customer's own session from localStorage (set at check-in time)
  useEffect(() => {
    setMySessionId(localStorage.getItem(MY_SESSION_KEY));
  }, []);

  // Is this client currently in the waiting queue?
  const myQueueItem = mySessionId
    ? queue.find((q) => q.sessionId === mySessionId) ?? null
    : null;

  // If the client has a session key but is NOT in the waiting queue and the
  // queue has finished loading, they've been called up (in_progress).
  // Fetch their full session record so we can show the correct status card
  // and supply a clientName to the cancellation modal.
  const isCalledUp = !!mySessionId && !isLoading && myQueueItem === null;

  const { data: calledUpSession } = useQuery<Session | null>({
    queryKey: ["session", "status", mySessionId],
    queryFn: () =>
      mySessionId
        ? (api.checkIn.getById(mySessionId) as Promise<Session>)
        : Promise.resolve(null),
    enabled: isCalledUp,
    staleTime: 30_000,
    retry: false,
  });

  // If the server reports the session is already completed or cancelled,
  // the localStorage key is stale — clear it and return to the kiosk.
  useEffect(() => {
    if (!calledUpSession) return;
    if (
      calledUpSession.status === "completed" ||
      calledUpSession.status === "cancelled"
    ) {
      localStorage.removeItem(MY_SESSION_KEY);
      navigate({ to: "/kiosk" });
    }
  }, [calledUpSession?.status, navigate]);

  // Derive the session info needed by the cancellation modal regardless of
  // whether the client is in the waiting queue or already called up.
  const cancelSessionId =
    myQueueItem?.sessionId ?? (isCalledUp ? mySessionId : null) ?? null;
  const cancelClientName =
    myQueueItem?.clientName ?? calledUpSession?.name ?? "";

  return (
    <div className="p-4 md:p-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8 gap-3 sm:gap-0">
        <div>
          <h1 className="text-3xl font-black gradient-text mb-1">Live Queue</h1>
          <p className="text-muted-foreground text-sm">
            Real-time view of clients currently waiting.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground glass-card px-3 py-2">
          <Wifi className="h-3 w-3 text-emerald-400 animate-pulse" />
          Auto-refreshes every 15s
          {dataUpdatedAt > 0 && (
            <span className="text-muted-foreground/50">
              · {formatRelativeTime(new Date(dataUpdatedAt).toISOString())}
            </span>
          )}
        </div>
      </div>

      {/* ── Your position card — shown while waiting in the queue ───────────── */}
      {myQueueItem && (
        <GlossCard className="mb-6 flex items-center justify-between gap-4 py-4 border-blue-500/30">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
              Your spot
            </p>
            <p className="text-lg font-black gradient-text">
              #{String(myQueueItem.queueNumber).padStart(3, "0")} ·{" "}
              Position {myQueueItem.queuePosition}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Est. wait:{" "}
              {myQueueItem.estimatedWaitMinutes === 0
                ? "You're next!"
                : `~${myQueueItem.estimatedWaitMinutes} min`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 shrink-0"
            onClick={() => setCancelOpen(true)}
          >
            <XCircle className="h-3.5 w-3.5" />
            Cancel my spot
          </Button>
        </GlossCard>
      )}

      {/* ── Called-up card — shown when staff has processed this client ────── */}
      {isCalledUp && calledUpSession?.status === "in_progress" && (
        <GlossCard className="mb-6 border-emerald-500/30">
          <div className="flex items-start gap-4 py-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <Bell className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground mb-0.5">
                You've been called up!
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A staff member is ready for you. Please proceed to the
                service desk, then submit your feedback when you're done.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  size="sm"
                  className="text-xs h-7"
                  onClick={() =>
                    navigate({
                      to: "/check-out/$sessionId",
                      params: { sessionId: mySessionId! },
                    })
                  }
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  Submit Feedback
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7 text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10"
                  onClick={() => setCancelOpen(true)}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Cancel my session
                </Button>
              </div>
            </div>
          </div>
        </GlossCard>
      )}

      {/* ── Stats row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <GlossCard className="py-4 flex items-center gap-3">
          <Users className="h-5 w-5 text-blue-400" />
          <div>
            <p className="text-2xl font-black tabular-nums gradient-text">
              {isLoading ? "—" : queue.length}
            </p>
            <p className="text-xs text-muted-foreground">Waiting</p>
          </div>
        </GlossCard>
        <GlossCard className="py-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-cyan-400" />
          <div>
            <p className="text-2xl font-black tabular-nums gradient-text">
              {isLoading || queue.length === 0
                ? "0"
                : queue[queue.length - 1].estimatedWaitMinutes}
            </p>
            <p className="text-xs text-muted-foreground">Max wait (min)</p>
          </div>
        </GlossCard>
        <GlossCard className="py-4 flex items-center gap-3">
          <RefreshCw className="h-4 w-4 text-blue-400" />
          <div>
            <p className="text-2xl font-black tabular-nums gradient-text">
              15s
            </p>
            <p className="text-xs text-muted-foreground">Refresh rate</p>
          </div>
        </GlossCard>
      </div>

      {/* ── Cancellation modal (waiting or in_progress) ──────────────────────── */}
      {cancelSessionId && cancelClientName && (
        <CancellationFeedbackModal
          sessionId={cancelSessionId}
          clientName={cancelClientName}
          open={cancelOpen}
          onClose={() => setCancelOpen(false)}
          onCancelled={() => {
            setCancelOpen(false);
            setMySessionId(null);
            // MY_SESSION_KEY is cleared by useCancelCheckIn.onSuccess;
            // send the client back to kiosk for a clean slate.
            navigate({ to: "/kiosk" });
          }}
        />
      )}

      {/* ── Queue table ──────────────────────────────────────────────────────── */}
      <GlossCard className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="space-y-px p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-lg shimmer" />
            ))}
          </div>
        ) : queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">No clients currently waiting</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    #
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Client
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Checked In
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Est. Wait
                  </th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item) => (
                  <tr
                    key={item.sessionId}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-lg font-black gradient-text tabular-nums">
                        {String(item.queueNumber).padStart(3, "0")}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-foreground">
                        {item.clientName}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="secondary" className="text-xs">
                        {item.purpose.length > 24
                          ? item.purpose.slice(0, 24) + "…"
                          : item.purpose}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground text-xs">
                      {formatRelativeTime(item.checkedInAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-cyan-400 tabular-nums">
                        {item.estimatedWaitMinutes === 0
                          ? "Next!"
                          : `~${item.estimatedWaitMinutes}m`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlossCard>
    </div>
  );
}
