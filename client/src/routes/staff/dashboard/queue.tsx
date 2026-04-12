// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useQueue, useInProgressQueue } from "@/hooks/useQueue";
import { GlossCard } from "@/components/shared/GlossCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import { api } from "@/lib/api";
import { Bell, CheckCircle2, UserCheck, Clock, Check } from "lucide-react";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryClient";

export const Route = createFileRoute("/staff/dashboard/queue")({
  component: StaffQueuePage,
});

function StaffQueuePage() {
  const queryClient = useQueryClient();
  const { data: queue = [], isLoading: isLoadingQueue } = useQueue();
  const { data: inProgress = [], isLoading: isLoadingInProgress } = useInProgressQueue();

  const callUpMutation = useMutation({
    mutationFn: (sessionId: string) => api.queue.processClient(sessionId),
    onSuccess: () => {
      toast.success("Client called up successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.queue() });
      queryClient.invalidateQueries({ queryKey: ["queue", "in-progress"] });
    },
    onError: () => {
      toast.error("Failed to call up client");
    },
  });

  const completeMutation = useMutation({
    mutationFn: (sessionId: string) => api.admin.completeSession(sessionId),
    onSuccess: () => {
      toast.success("Session manually completed");
      queryClient.invalidateQueries({ queryKey: ["queue", "in-progress"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary() });
    },
    onError: () => {
      toast.error("Failed to complete session");
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* ── Waiting Queue (Call Up) ───────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-amber-400" />
            Waiting Queue
            <Badge variant="secondary" className="ml-2 bg-amber-600/10 text-amber-400 border-amber-600/20">
              {queue.length}
            </Badge>
          </h2>
        </div>

        {isLoadingQueue ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-white/5 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : queue.length === 0 ? (
          <GlossCard className="py-12 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-3 opacity-50" />
            <p className="text-muted-foreground text-sm">Queue is perfectly clear</p>
          </GlossCard>
        ) : (
          <div className="space-y-3">
            {queue.map((item) => (
              <GlossCard key={item.sessionId} className="flex items-center justify-between p-4 gap-4 transition-transform hover:scale-[1.01]">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-lg font-black tabular-nums gradient-text">
                      #{String(item.queueNumber).padStart(3, "0")}
                    </span>
                    <h3 className="font-semibold text-foreground truncate">{item.clientName}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] uppercase bg-white/5 border-white/10">
                      {item.purpose}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(item.checkedInAt)} (wait: {item.estimatedWaitMinutes}m)
                    </span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => callUpMutation.mutate(item.sessionId)}
                  disabled={callUpMutation.isPending}
                  className="btn-gradient shrink-0 shadow-lg shadow-amber-600/20"
                  size="sm"
                >
                  <Bell className="h-4 w-4 mr-1.5" />
                  Call Up
                </Button>
              </GlossCard>
            ))}
          </div>
        )}
      </div>

      {/* ── In-Progress Queue (Complete) ──────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-5 w-5 text-emerald-400" />
            Called Up & Processing
            <Badge variant="secondary" className="ml-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              {inProgress.length}
            </Badge>
          </h2>
        </div>

        {isLoadingInProgress ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-24 bg-white/5 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : inProgress.length === 0 ? (
          <GlossCard className="py-12 flex flex-col items-center justify-center text-center opacity-70">
            <p className="text-muted-foreground text-sm">No clients currently processing</p>
          </GlossCard>
        ) : (
          <div className="space-y-3">
            {inProgress.map((session) => (
              <GlossCard key={session.id} className="flex items-center justify-between p-4 gap-4 border-emerald-500/30 bg-emerald-500/5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-lg font-black tabular-nums text-emerald-400">
                      #{String(session.queueNumber).padStart(3, "0")}
                    </span>
                    <h3 className="font-semibold text-foreground truncate">{session.name}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="text-emerald-400 font-medium">Currently Being Served</span>
                    <span className="px-2 py-0.5 bg-white/5 rounded-md border border-white/10">
                      {session.purpose}
                    </span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => completeMutation.mutate(session.id)}
                  disabled={completeMutation.isPending}
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
                >
                  <Check className="h-4 w-4 mr-1.5" />
                  Mark Processed
                </Button>
              </GlossCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

