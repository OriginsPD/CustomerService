import { useState } from "react";
import {
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  UserCheck,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProcessClient } from "@/hooks/useQueueManagement";
import type { QueueItem } from "@vcc/shared";

interface ProcessClientModalProps {
  client: QueueItem | null;
  open: boolean;
  onClose: () => void;
}

export function ProcessClientModal({
  client,
  open,
  onClose,
}: ProcessClientModalProps) {
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const processClient = useProcessClient();

  const checkoutUrl = client
    ? `${window.location.origin}/check-out/${client.sessionId}`
    : "";

  const handleProcess = async () => {
    if (!client) return;
    await processClient.mutateAsync(client.sessionId);
    setDone(true);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(checkoutUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setDone(false);
    onClose();
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {done ? (
          /* ── Success state: show checkout link ──────────────────────────── */
          <div className="flex flex-col gap-5">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600/30 to-cyan-500/30 border border-emerald-500/30">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {client.clientName} has been processed
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Share the link below so they can submit their feedback.
                </p>
              </div>
            </div>

            {/* Checkout link */}
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                Feedback link for client
              </p>
              <div className="flex items-center gap-2">
                <p className="flex-1 truncate text-xs text-cyan-400 font-mono">
                  {checkoutUrl}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="shrink-0 h-7 text-xs"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(checkoutUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                Open Link
              </Button>
              <Button className="flex-1" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* ── Confirm state ──────────────────────────────────────────────── */
          <>
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600/20 to-cyan-500/20 border border-blue-500/30">
                  <UserCheck className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              <DialogTitle className="text-center">Mark as Processed?</DialogTitle>
              <DialogDescription className="text-center">
                This will remove{" "}
                <span className="text-foreground font-medium">
                  {client.clientName}
                </span>{" "}
                from the queue and generate a feedback link for them.
              </DialogDescription>
            </DialogHeader>

            {/* Client details */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.04] text-sm">
              {[
                ["Queue #", String(client.queueNumber).padStart(3, "0")],
                ["Name", client.clientName],
                ["Purpose", client.purpose],
                ["Checked in", new Date(client.checkedInAt).toLocaleTimeString()],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-muted-foreground text-xs">{label}</span>
                  <span className="text-foreground font-medium">{value}</span>
                </div>
              ))}
            </div>

            {processClient.isError && (
              <p className="text-xs text-rose-400 text-center">
                {processClient.error?.message ?? "Something went wrong."}
              </p>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleProcess}
                disabled={processClient.isPending}
              >
                {processClient.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
                Confirm Processed
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
