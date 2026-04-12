import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ArrowRight, MessageSquare, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QueuePositionCard } from "./QueuePositionCard";
import { CancellationFeedbackModal } from "./CancellationFeedbackModal";
import { MY_SESSION_KEY } from "@/lib/auth";
import type { Session } from "@vcc/shared";

// ── Props ─────────────────────────────────────────────────────────────────────

interface ResumeSessionCardProps {
  session: Session;
  queuePosition: number;
  estimatedWaitMinutes: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ResumeSessionCard({
  session,
  queuePosition,
  estimatedWaitMinutes,
}: ResumeSessionCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);

  /** Called after the cancel API call succeeds in CancellationFeedbackModal */
  const handleCancelled = () => {
    setCancelOpen(false);
    // useCancelCheckIn hook already removes MY_SESSION_KEY in its onSuccess,
    // so we just invalidate the resume query to force a re-render to the fresh form.
    queryClient.invalidateQueries({ queryKey: ["session", "resume"] });
    navigate({ to: "/check-in" });
  };

  const isInProgress = session.status === "in_progress";

  return (
    <>
      <div className="max-w-xl mx-auto space-y-4">
        {/* Header card */}
        <div className="glass-card gloss-overlay p-6 rounded-2xl space-y-4">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/30 to-gold-500/20 border border-amber-600/20">
              <CheckCircle2 className="h-5 w-5 text-gold-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground leading-tight">
                Welcome back, {session.name.split(" ")[0]}!
              </h2>
              <p className="text-xs text-muted-foreground">
                {isInProgress
                  ? "A staff member is attending to you"
                  : "You're still in the queue"}
              </p>
            </div>
          </div>

          {/* Purpose pill */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Purpose:</span>
            <span className="inline-flex items-center rounded-full border border-amber-600/20 bg-amber-600/10 px-2.5 py-0.5 text-xs font-medium text-blue-300">
              {session.purpose}
            </span>
          </div>

          {/* Queue position widget */}
          <QueuePositionCard
            queueNumber={session.queueNumber}
            queuePosition={queuePosition}
            estimatedWaitMinutes={estimatedWaitMinutes}
          />

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Button
              className="flex-1 bg-gradient-to-r from-amber-500 to-gold-500 hover:from-amber-600 hover:to-gold-400 text-white font-semibold shadow-lg shadow-amber-600/20"
              onClick={() => navigate({ to: "/queue" })}
            >
              View Live Queue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="flex-1 border-white/10 hover:bg-white/5"
              onClick={() =>
                navigate({
                  to: "/check-out/$sessionId",
                  params: { sessionId: session.id },
                })
              }
            >
              <MessageSquare className="mr-2 h-4 w-4 text-gold-400" />
              Submit Feedback
            </Button>
          </div>
        </div>

        {/* Danger zone — end session */}
        <div className="glass-card p-4 rounded-2xl border border-rose-500/10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">End Session</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cancel your spot and leave the queue
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20"
              onClick={() => setCancelOpen(true)}
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              End Session
            </Button>
          </div>
        </div>
      </div>

      {/* Cancellation modal — reuses existing component */}
      <CancellationFeedbackModal
        sessionId={session.id}
        clientName={session.name}
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onCancelled={handleCancelled}
      />
    </>
  );
}

