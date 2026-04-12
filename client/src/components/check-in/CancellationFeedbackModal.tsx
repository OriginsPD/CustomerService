import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { XCircle, CheckCircle2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCancelCheckIn } from "@/hooks/useCancelCheckIn";

// ── Cancellation reasons ──────────────────────────────────────────────────────
const CANCEL_REASONS = [
  "Wait time was too long",
  "My issue was resolved while waiting",
  "I need to reschedule for another time",
  "I had to leave unexpectedly",
  "I came to the wrong department",
  "Other",
] as const;

const CancellationSchema = z.object({
  reason: z.string().min(1, "Please select a reason"),
  wouldReschedule: z.enum(["yes", "no"]),
  additionalComment: z.string().max(300).optional(),
});

type CancellationForm = z.infer<typeof CancellationSchema>;

interface CancellationFeedbackModalProps {
  sessionId: string;
  clientName: string;
  open: boolean;
  onClose: () => void;
  /** Called after the cancel API succeeds so the parent can clean up */
  onCancelled: () => void;
}

export function CancellationFeedbackModal({
  sessionId,
  clientName,
  open,
  onClose,
  onCancelled,
}: CancellationFeedbackModalProps) {
  const [done, setDone] = useState(false);
  const cancelCheckIn = useCancelCheckIn();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CancellationForm>({
    resolver: zodResolver(CancellationSchema),
    defaultValues: { wouldReschedule: "no" },
  });

  const onSubmit = async (data: CancellationForm) => {
    await cancelCheckIn.mutateAsync({
      sessionId,
      reason: data.reason,
      wouldReschedule: data.wouldReschedule === "yes",
      additionalComment: data.additionalComment || undefined,
    });
    setDone(true);
  };

  const handleClose = () => {
    setDone(false);
    onClose();
    if (done) onCancelled();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {done ? (
          /* ── Success state ──────────────────────────────────────────────── */
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/30 to-gold-500/30 border border-gold-500/30">
              <CheckCircle2 className="h-7 w-7 text-gold-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">
                You've been removed from the queue
              </h3>
              <p className="text-sm text-muted-foreground">
                Thank you for letting us know, {clientName}. We hope to assist
                you soon — feel free to check back in any time.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full mt-2">
              Done
            </Button>
          </div>
        ) : (
          /* ── Feedback form ──────────────────────────────────────────────── */
          <>
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10">
                  <XCircle className="h-6 w-6 text-rose-400" />
                </div>
              </div>
              <DialogTitle className="text-center">
                Before you go, {clientName}…
              </DialogTitle>
              <DialogDescription className="text-center">
                Help us improve by sharing why you're cancelling. This only
                takes a few seconds.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-5 mt-2"
            >
              {/* Q1 — Reason */}
              <div className="flex flex-col gap-2">
                <Label>
                  What's the main reason for cancelling?{" "}
                  <span className="text-gold-400">*</span>
                </Label>
                <Controller
                  name="reason"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-1 gap-1.5">
                      {CANCEL_REASONS.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => field.onChange(r)}
                          className={[
                            "text-left rounded-lg border px-3 py-2.5 text-sm transition-all",
                            field.value === r
                              ? "border-amber-600/60 bg-amber-600/10 text-foreground"
                              : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                          ].join(" ")}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                />
                {errors.reason && (
                  <p className="text-xs text-rose-400">{errors.reason.message}</p>
                )}
              </div>

              {/* Q2 — Would reschedule */}
              <div className="flex flex-col gap-2">
                <Label>Would you like to come back and reschedule?</Label>
                <div className="flex gap-3">
                  {(["yes", "no"] as const).map((val) => (
                    <label
                      key={val}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        {...register("wouldReschedule")}
                        value={val}
                        className="accent-amber-600"
                      />
                      <span className="text-sm text-muted-foreground capitalize">
                        {val === "yes" ? "Yes, I'll reschedule" : "No, not at this time"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Q3 — Extra comment */}
              <div className="flex flex-col gap-2">
                <Label>Any additional comments? (optional)</Label>
                <textarea
                  {...register("additionalComment")}
                  rows={2}
                  placeholder="Anything else you'd like us to know…"
                  className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-amber-600/50"
                />
              </div>

              {/* Error banner */}
              {cancelCheckIn.isError && (
                <p className="text-xs text-rose-400 text-center">
                  {cancelCheckIn.error?.message ?? "Something went wrong. Please try again."}
                </p>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full border-rose-500/40 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                  disabled={cancelCheckIn.isPending}
                >
                  {cancelCheckIn.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Cancel My Queue Spot
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  onClick={handleClose}
                >
                  Never mind, keep my spot
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

