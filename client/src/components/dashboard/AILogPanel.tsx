import { useState } from "react";
import { Brain, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAILog } from "@/hooks/useDashboard";
import { formatRelativeTime, getActionColor } from "@/lib/utils";

interface AILogPanelProps {
  open: boolean;
  onClose: () => void;
}

const actionLabels: Record<string, string> = {
  add_question: "Added",
  remove_question: "Removed",
  retain: "Retained",
  no_change: "Audit",
};

const actionVariants: Record<string, "add" | "remove" | "retain" | "outline"> = {
  add_question: "add",
  remove_question: "remove",
  retain: "retain",
  no_change: "outline",
};

export function AILogPanel({ open, onClose }: AILogPanelProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAILog(page);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2 pr-8">
            <Brain className="h-5 w-5 text-gold-400" />
            <SheetTitle>AI Decision Log</SheetTitle>
          </div>
          <SheetDescription>
            Full audit trail of AI-driven form adaptations. Every question added,
            removed, or retained is logged with reasoning.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-6 pb-6 mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading decisions…
            </div>
          ) : !data || data.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
              <Brain className="h-10 w-10 mb-3 opacity-30" />
              <p>No AI decisions yet</p>
              <p className="text-xs mt-1">Run an analysis or wait for the 24h cycle</p>
            </div>
          ) : (
            <>
              {data.data.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col gap-2"
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <Badge variant={actionVariants[entry.action] ?? "secondary"}>
                      {actionLabels[entry.action] ?? entry.action}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {formatRelativeTime(entry.runAt)}
                    </span>
                  </div>

                  {/* Question text */}
                  {entry.questionText && (
                    <p className="text-sm text-foreground font-medium leading-snug">
                      "{entry.questionText}"
                    </p>
                  )}

                  {/* Reasoning */}
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {entry.reasoning}
                  </p>

                  {/* Sample size + confidence */}
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-muted-foreground/50">
                      Based on {entry.feedbackSampleSize} feedback response
                      {entry.feedbackSampleSize !== 1 ? "s" : ""}
                    </p>
                    {entry.confidenceLevel != null && (
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          entry.confidenceLevel >= 0.75
                            ? "bg-emerald-500/15 text-emerald-400"
                            : entry.confidenceLevel >= 0.5
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-rose-500/15 text-rose-400"
                        }`}
                      >
                        {Math.round(entry.confidenceLevel * 100)}% confidence
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {page} of {data.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) => Math.min(data.totalPages, p + 1))
                    }
                    disabled={page === data.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

