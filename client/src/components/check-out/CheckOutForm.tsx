import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, MessageSquareHeart, Sparkles, Brain } from "lucide-react";
import { CheckOutFormSchema, type CheckOutForm, type FeedbackResponse } from "@vcc/shared";
import { useCheckOut } from "@/hooks/useCheckOut";
import { useSessionQuestions } from "@/hooks/useAIQuestions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { GlossCard } from "@/components/shared/GlossCard";
import { StarRatingInput } from "./StarRatingInput";
import { CommentTextarea } from "./CommentTextarea";
import { DynamicQuestions } from "./DynamicQuestions";
import { FeedbackSuccessDrawer } from "./FeedbackSuccessDrawer";
import { cn } from "@/lib/utils";

interface CheckOutFormProps {
  sessionId: string;
}

export function CheckOutFormComponent({ sessionId }: CheckOutFormProps) {
  const [result, setResult] = useState<FeedbackResponse | null>(null);
  const checkOut = useCheckOut();
  const { data: questions = [], isLoading: questionsLoading } = useSessionQuestions(sessionId);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<CheckOutForm>({
    resolver: zodResolver(CheckOutFormSchema),
    defaultValues: {
      sessionId,
      rating: 0 as any,
      comment: "",
      dynamicAnswers: [],
    },
  });

  // Sync questions to form default values once loaded
  useEffect(() => {
    if (questions.length > 0) {
      reset({
        sessionId,
        rating: 0 as any,
        comment: "",
        dynamicAnswers: questions.map((q) => ({
          questionId: q.id,
          answer: q.type === "scale" ? "5" : q.type === "boolean" ? "false" : "",
        })),
      });
    }
  }, [questions, reset, sessionId]);

  const commentValue = watch("comment");

  const onSubmit = async (data: CheckOutForm) => {
    try {
      const res = await checkOut.mutateAsync(data);
      setResult(res);
    } catch (err) {
      console.error("Submission failed:", err);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <GlossCard className="max-w-2xl mx-auto overflow-hidden border-white/5 shadow-2xl">
          {/* ── Header ── */}
          <div className="mb-10 relative">
            <div className="flex items-center gap-4 mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-gold-500 shadow-xl shadow-amber-500/20">
                <MessageSquareHeart className="h-6 w-6 text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-black gradient-text tracking-tight">
                  Checkout Feedback
                </h2>
                <p className="text-xs text-muted-foreground font-medium">
                  Refining our care through your insights
                </p>
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-amber-500/30 via-stone-800 to-transparent" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10" noValidate>
            {/* Star rating */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                Experience Rating
              </Label>
              <StarRatingInput
                control={control}
                name="rating"
                error={errors.rating?.message}
              />
            </div>

            {/* Comment */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                Detailed Observation
              </Label>
              <CommentTextarea
                register={register}
                value={commentValue}
                error={errors.comment}
              />
            </div>

            {/* Dynamic AI questions pool */}
            <div className="border-t border-white/5 pt-10 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Contextual Inquiry</span>
                </div>
                
                {questionsLoading && (
                  <div className="flex items-center gap-2 text-[10px] text-amber-500/60 font-bold uppercase animate-pulse">
                    <Brain className="h-3 w-3" /> AI Personalizing...
                  </div>
                )}
              </div>

              {questionsLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-24 w-full rounded-2xl bg-white/5 shimmer" />
                  ))}
                </div>
              ) : (
                <DynamicQuestions
                  questions={questions}
                  control={control}
                  isLoading={questionsLoading}
                />
              )}
            </div>

            {/* Submit */}
            <div className="pt-4">
              <Button
                type="submit"
                size="lg"
                className="w-full btn-gradient h-14 text-base shadow-2xl shadow-amber-500/30 group"
                disabled={checkOut.isPending || questionsLoading}
              >
                {checkOut.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Archive Feedback 
                    <Send className="ml-2 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </GlossCard>
      </motion.div>

      {/* Success drawer */}
      {result && (
        <FeedbackSuccessDrawer
          result={result}
          open
          onClose={() => setResult(null)}
        />
      )}
    </>
  );
}
