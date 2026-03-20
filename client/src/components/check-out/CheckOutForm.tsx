import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { CheckOutFormSchema, type CheckOutForm, type FeedbackResponse } from "@vcc/shared";
import { useCheckOut } from "@/hooks/useCheckOut";
import { useAIQuestions } from "@/hooks/useAIQuestions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { GlossCard } from "@/components/shared/GlossCard";
import { StarRatingInput } from "./StarRatingInput";
import { CommentTextarea } from "./CommentTextarea";
import { DynamicQuestions } from "./DynamicQuestions";
import { FeedbackSuccessDrawer } from "./FeedbackSuccessDrawer";

interface CheckOutFormProps {
  sessionId: string;
}

export function CheckOutFormComponent({ sessionId }: CheckOutFormProps) {
  const [result, setResult] = useState<FeedbackResponse | null>(null);
  const checkOut = useCheckOut();
  const { data: questions = [], isLoading: questionsLoading } = useAIQuestions();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CheckOutForm>({
    resolver: zodResolver(CheckOutFormSchema),
    defaultValues: {
      sessionId,
      rating: 0 as any,
      comment: "",
      dynamicAnswers: questions.map((q) => ({
        questionId: q.id,
        answer: q.type === "scale" ? "5" : q.type === "boolean" ? "false" : "",
      })),
    },
  });

  const commentValue = watch("comment");

  const onSubmit = async (data: CheckOutForm) => {
    // Attach question IDs to dynamic answers
    const enriched: CheckOutForm = {
      ...data,
      dynamicAnswers: questions.map((q, i) => ({
        questionId: q.id,
        answer: data.dynamicAnswers?.[i]?.answer ?? "",
      })),
    };
    const res = await checkOut.mutateAsync(enriched);
    setResult(res);
  };

  return (
    <>
      <GlossCard className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold gradient-text mb-1">
            Share Your Feedback
          </h2>
          <p className="text-xs text-muted-foreground">
            Help us improve by rating your experience today.
          </p>
          <div className="h-px bg-gradient-to-r from-blue-600/50 to-transparent mt-4" />
        </div>

        {checkOut.isError && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
            {checkOut.error?.message ?? "Something went wrong. Please try again."}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {/* Star rating */}
          <div className="flex flex-col gap-2">
            <Label>
              Overall Rating <span className="text-cyan-400">*</span>
            </Label>
            <StarRatingInput
              control={control}
              name="rating"
              error={errors.rating?.message}
            />
          </div>

          {/* Comment */}
          <div className="flex flex-col gap-2">
            <Label>
              Your Comments <span className="text-cyan-400">*</span>
            </Label>
            <CommentTextarea
              register={register}
              value={commentValue}
              error={errors.comment}
            />
          </div>

          {/* Dynamic AI questions */}
          {(questions.length > 0 || questionsLoading) && (
            <div className="border-t border-white/[0.06] pt-6">
              <DynamicQuestions
                questions={questions}
                control={control}
                isLoading={questionsLoading}
              />
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={checkOut.isPending}
            >
              {checkOut.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting Feedback…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </form>
      </GlossCard>

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
