import { CheckCircle2, Heart, ThumbsUp, AlertCircle } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { FeedbackResponse } from "@vcc/shared";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, getSentimentColor } from "@/lib/utils";

interface FeedbackSuccessDrawerProps {
  result: FeedbackResponse;
  open: boolean;
  onClose: () => void;
}

const sentimentIcons = {
  positive: ThumbsUp,
  neutral: CheckCircle2,
  negative: AlertCircle,
};

const sentimentVariants = {
  positive: "positive",
  neutral: "neutral",
  negative: "negative",
} as const;

export function FeedbackSuccessDrawer({
  result,
  open,
  onClose,
}: FeedbackSuccessDrawerProps) {
  const navigate = useNavigate();
  const SentimentIcon = sentimentIcons[result.sentiment];

  const handleNewCheckin = () => {
    onClose();
    navigate({ to: "/check-in" });
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-2xl border-t border-white/10 px-0 pb-8">
        <SheetHeader>
          <div className="flex flex-col items-center gap-4 pt-4 pb-2">
            {/* Success icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-gold-500 shadow-xl shadow-amber-600/30">
              <Heart className="h-8 w-8 text-white fill-white" />
            </div>

            <SheetTitle className="text-center text-2xl">
              Thank You!
            </SheetTitle>

            <SheetDescription className="text-center max-w-sm text-sm leading-relaxed px-6">
              {result.thankYouMessage}
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="px-6 flex flex-col gap-4 mt-4">
          {/* Sentiment analysis result */}
          <div className="glass-card gloss-overlay p-4 flex items-center gap-4">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", {
              "bg-gold-500/15": result.sentiment === "positive",
              "bg-amber-600/15": result.sentiment === "neutral",
              "bg-rose-500/15": result.sentiment === "negative",
            })}>
              <SentimentIcon className={cn("h-5 w-5", getSentimentColor(result.sentiment))} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Sentiment Detected
              </p>
              <div className="flex items-center gap-2">
                <Badge variant={sentimentVariants[result.sentiment]}>
                  {result.sentiment.charAt(0).toUpperCase() + result.sentiment.slice(1)}
                </Badge>
                <span className="text-xs text-muted-foreground tabular-nums">
                  Score: {result.sentimentScore > 0 ? "+" : ""}{result.sentimentScore.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* AI-powered note */}
          <p className="text-center text-xs text-muted-foreground">
            Your feedback is being analyzed by our AI system to continuously
            improve our customer service experience.
          </p>

          <Button onClick={handleNewCheckin} className="w-full mt-2">
            New Check-In
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

