import { useState, useMemo, useEffect, Fragment } from "react";
import { Users, Wifi, UserCheck, Clock } from "lucide-react";
import { GlossCard } from "@/components/shared/GlossCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProcessClientModal } from "./ProcessClientModal";
import { QRCodePanel } from "@/components/shared/QRCodePanel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { QrCode, PlusCircle, Search } from "lucide-react";
import { useQueue, useCompleteClient } from "@/hooks/useQueue";
import { useQueueStream } from "@/hooks/useQueueStream";
import { formatRelativeTime } from "@/lib/utils";
import type { QueueItem } from "@vcc/shared";

// ── Urgency helpers ───────────────────────────────────────────────────────────

function getElapsedMinutes(checkedInAt: string): number {
  return Math.floor((Date.now() - new Date(checkedInAt).getTime()) / 60_000);
}

function formatWaitTime(checkedInAt: string): string {
  const m = getElapsedMinutes(checkedInAt);
  return m < 1 ? "<1m" : `${m}m`;
}

type UrgencyLevel = "normal" | "warning" | "critical";

function getUrgency(checkedInAt: string): UrgencyLevel {
  const m = getElapsedMinutes(checkedInAt);
  if (m >= 15) return "critical";
  if (m >= 5) return "warning";
  return "normal";
}

const URGENCY_STYLE: Record<UrgencyLevel, { row: string; time: string }> = {
  normal:   { row: "bg-emerald-500/[0.04] border-l-2 border-l-emerald-500/40", time: "text-emerald-400" },
  warning:  { row: "bg-amber-500/[0.04] border-l-2 border-l-amber-500/60",  time: "text-amber-400" },
  critical: { row: "bg-rose-500/[0.06] border-l-2 border-l-rose-500/70",    time: "text-rose-400 font-semibold" },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function QueueManagementPanel() {
  const { data: queue = [], isLoading, dataUpdatedAt } = useQueue();
  const [selectedClient, setSelectedClient] = useState<QueueItem | null>(null);
  const [search, setSearch] = useState("");
  const completeMutation = useCompleteClient();
  const { isOffline } = useQueueStream();
  const [qrOpen, setQrOpen] = useState(false);

  // Clear search when queue size changes (processed client might no longer exist)
  useEffect(() => {
    setSearch("");
  }, [queue.length]);

  const filteredQueue = useMemo(
    () =>
      search.trim()
        ? queue.filter(
            (q) =>
              q.clientName.toLowerCase().includes(search.toLowerCase()) ||
              q.purpose.toLowerCase().includes(search.toLowerCase())
          )
        : queue,
    [queue, search]
  );

  const stats = useMemo(() => {
    if (queue.length === 0) return null;
    const maxWait = Math.max(...queue.map((q) => getElapsedMinutes(q.checkedInAt)));
    const urgentCount = queue.filter((q) => getUrgency(q.checkedInAt) !== "normal").length;
    return { maxWait, urgentCount };
  }, [queue]);

  return (
    <>
      <GlossCard className="p-0 overflow-hidden">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-6 py-4 border-b border-white/[0.06]">
          {/* Left: title + count */}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-foreground">Live Queue</h2>
            {!isLoading && (
              <span className="ml-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-[11px] font-medium text-blue-300">
                {queue.length} waiting
              </span>
            )}
            {!isLoading && queue.filter(q => q.queuePosition > 0).length > 0 && (
              <Button
                size="sm"
                className="ml-4 h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                onClick={() => setSelectedClient(queue.find(q => q.queuePosition > 0) || null)}
              >
                Call Next Client
              </Button>
            )}
          </div>

          {/* Right: stats + live indicator */}
          <div className="flex items-center gap-3">
            {!isLoading && stats && (
              <>
                <div className="flex items-center gap-1 text-[11px]">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span
                    className={
                      stats.maxWait >= 20
                        ? "text-rose-400 font-semibold"
                        : stats.maxWait >= 10
                        ? "text-amber-400"
                        : "text-muted-foreground"
                    }
                  >
                    {stats.maxWait}m max wait
                  </span>
                </div>
                {stats.urgentCount > 0 && (
                  <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[11px] font-medium text-rose-400">
                    {stats.urgentCount} overdue
                  </span>
                )}
              </>
            )}
            {queue.length > 3 && (
              <input
                type="search"
                placeholder="Filter by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-6 w-32 rounded border border-white/10 bg-white/[0.04] px-2 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500/40"
              />
            )}
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {isOffline ? (
                <>
                  <Wifi className="h-3 w-3 text-rose-400" />
                  <span className="text-rose-400 font-semibold">Offline</span>
                </>
              ) : (
                <>
                  <Wifi className="h-3 w-3 text-emerald-400 animate-pulse" />
                  {dataUpdatedAt > 0
                    ? `Updated ${formatRelativeTime(new Date(dataUpdatedAt).toISOString())}`
                    : "Live"}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-px p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 rounded-lg shimmer" />
            ))}
          </div>
        ) : queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-6 group">
              <Users className="h-8 w-8 text-blue-400/50 group-hover:text-blue-400 transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">No clients waiting</h3>
            <p className="text-sm text-muted-foreground max-w-[280px] mb-8 leading-relaxed">
              The queue is currently empty. You can scan new clients or monitor analytics while you wait.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-4 gap-2 border-white/10 hover:bg-white/5"
                onClick={() => setQrOpen(true)}
              >
                <QrCode className="h-4 w-4 text-cyan-400" />
                Show Check-In QR
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[580px]">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  {["#", "Client", "Purpose", "Waiting", "Est.", "Action"].map((h) => (
                    <th
                      key={h}
                      className={[
                        "px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider",
                        h === "Action" ? "text-right pr-5" : "text-left",
                        h === "#" ? "pl-5" : "",
                      ].join(" ")}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredQueue.length === 0 && search.trim() ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      No results for &ldquo;{search}&rdquo;
                    </td>
                  </tr>
                ) : null}
                {filteredQueue.map((item) => {
                  const isProcessing = item.queuePosition === 0;
                  const isNext = item.queuePosition === 1;
                  const urgency = getUrgency(item.checkedInAt);
                  const { row: urgencyRow, time: urgencyTime } = URGENCY_STYLE[urgency];

                  const rowClass = isProcessing
                    ? "bg-purple-500/[0.08] border-l-2 border-l-purple-400"
                    : isNext
                    ? "bg-blue-500/[0.06] border-l-2 border-l-blue-400/70"
                    : urgencyRow;

                  return (
                    <Fragment key={item.sessionId}>
                      <tr
                        className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${rowClass}`}
                      >
                        {/* # */}
                        <td className="pl-5 pr-4 py-3">
                          {isProcessing ? (
                            <span className="text-xs font-black text-purple-400 tracking-wider">SERVING</span>
                          ) : (
                            <span
                              className={`text-base font-black tabular-nums ${
                                isNext ? "text-blue-300" : "gradient-text"
                              }`}
                            >
                              {String(item.queueNumber).padStart(3, "0")}
                            </span>
                          )}
                        </td>

                        {/* Client */}
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground leading-none">
                            {item.clientName}
                          </p>
                        </td>

                        {/* Purpose */}
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="text-[11px]" title={item.purpose}>
                            {item.purpose.length > 22
                              ? item.purpose.slice(0, 22) + "…"
                              : item.purpose}
                          </Badge>
                        </td>

                        {/* Waiting */}
                        <td className="px-4 py-3">
                          <span className={`text-xs tabular-nums ${isProcessing ? 'text-purple-400/80 font-semibold' : isNext ? "text-muted-foreground" : urgencyTime}`}>
                            {isProcessing ? "Now Processing" : formatWaitTime(item.checkedInAt)}
                          </span>
                        </td>

                        {/* Est. wait */}
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold text-cyan-400 tabular-nums">
                            {isProcessing
                              ? "—"
                              : item.estimatedWaitMinutes === 0
                              ? "Next!"
                              : `~${item.estimatedWaitMinutes}m`}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="pr-5 pl-4 py-3 text-right">
                          {isProcessing ? (
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-purple-500 hover:bg-purple-600 font-semibold"
                              onClick={() => completeMutation.mutate(item.sessionId)}
                              disabled={completeMutation.isPending}
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              Complete
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant={isNext ? "default" : "outline"}
                              className="h-7 text-xs"
                              onClick={() => setSelectedClient(item)}
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              {isNext ? "Call Next" : "Process"}
                            </Button>
                          )}
                        </td>
                      </tr>

                      {/* Gradient separator after position 1 */}
                      {isNext && filteredQueue.length > 1 && (
                        <tr aria-hidden="true">
                          <td colSpan={6} className="p-0">
                            <div className="h-px bg-gradient-to-r from-blue-500/30 via-cyan-500/20 to-transparent" />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlossCard>

      {/* Process confirmation modal */}
      <ProcessClientModal
        client={selectedClient}
        open={!!selectedClient}
        onClose={() => setSelectedClient(null)}
      />

      {/* QR Code Dialog Local */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Client Check-In QR</DialogTitle>
            <DialogDescription>
              Clients can scan this to join the live queue.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <QRCodePanel />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
