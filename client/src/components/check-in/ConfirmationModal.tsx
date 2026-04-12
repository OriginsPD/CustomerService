import { useState, useEffect } from "react";
import { CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { CheckInResponse } from "@vcc/shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QueuePositionCard } from "./QueuePositionCard";
import { CancellationFeedbackModal } from "./CancellationFeedbackModal";
import { MY_SESSION_KEY } from "@/lib/auth";

interface ConfirmationModalProps {
  data: CheckInResponse;
  open: boolean;
  onClose: () => void;
}

export function ConfirmationModal({ data, open, onClose }: ConfirmationModalProps) {
  const navigate = useNavigate();
  const [cancelOpen, setCancelOpen] = useState(false);

  // Persist session ID so the queue page can surface a cancel button for this client
  useEffect(() => {
    if (open) {
      localStorage.setItem(MY_SESSION_KEY, data.sessionId);
    }
  }, [open, data.sessionId]);

  const handleViewQueue = () => {
    onClose();
    navigate({ to: "/queue" });
  };

  const handleGoToCheckout = () => {
    onClose();
    navigate({ to: "/check-out/$sessionId", params: { sessionId: data.sessionId } });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-gold-500 shadow-lg shadow-amber-600/30">
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
            </div>
            <DialogTitle className="text-center">You're Checked In!</DialogTitle>
            <DialogDescription className="text-center">
              Welcome, <span className="text-foreground font-medium">{data.clientName}</span>.
              A team member will be with you shortly.
            </DialogDescription>
          </DialogHeader>

          {/* Queue position card */}
          <div className="my-2">
            <QueuePositionCard
              queueNumber={data.queueNumber}
              queuePosition={data.queuePosition}
              estimatedWaitMinutes={data.estimatedWaitMinutes}
            />
          </div>

          {/* Purpose reminder */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
              Reason for visit
            </p>
            <p className="text-sm text-foreground">{data.purpose}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-2">
            <Button onClick={handleViewQueue} variant="outline" className="w-full">
              <ExternalLink className="h-4 w-4" />
              View Live Queue
            </Button>
            <Button
              onClick={handleGoToCheckout}
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground hover:text-foreground text-xs"
            >
              Ready to leave? Submit feedback →
            </Button>
            {/* Cancel spot */}
            <div className="border-t border-white/[0.06] pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10"
                onClick={() => setCancelOpen(true)}
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancel my queue spot
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancellation feedback modal — mounts on top */}
      <CancellationFeedbackModal
        sessionId={data.sessionId}
        clientName={data.clientName}
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onCancelled={() => {
          setCancelOpen(false);
          onClose(); // close confirmation modal too
          navigate({ to: "/check-in" });
        }}
      />
    </>
  );
}

