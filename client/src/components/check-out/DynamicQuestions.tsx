import { type Control, Controller, useFieldArray } from "react-hook-form";
import { Brain, Loader2 } from "lucide-react";
import { type CheckOutForm, type DynamicQuestion } from "@vcc/shared";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { GradientBadge } from "@/components/shared/GradientBadge";

interface DynamicQuestionsProps {
  questions: DynamicQuestion[];
  control: Control<CheckOutForm>;
  isLoading?: boolean;
}

export function DynamicQuestions({
  questions,
  control,
  isLoading,
}: DynamicQuestionsProps) {
  const { fields } = useFieldArray({ control, name: "dynamicAnswers" });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading AI-generated questions…
      </div>
    );
  }

  if (questions.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-gold-400" />
        <span className="text-sm font-semibold text-foreground">
          A few more questions
        </span>
        <GradientBadge size="sm">AI</GradientBadge>
      </div>
      <p className="text-xs text-muted-foreground -mt-3">
        These questions are dynamically generated based on your visit and recent
        feedback patterns.
      </p>

      {questions.map((question, index) => (
        <Controller
          key={question.id}
          control={control}
          name={`dynamicAnswers.${index}.questionId` as any}
          defaultValue={question.id}
          render={() => (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col gap-3">
              <Label className="text-sm leading-snug">{question.text}</Label>

              <Controller
                control={control}
                name={`dynamicAnswers.${index}.answer`}
                defaultValue={question.type === "scale" ? "5" : question.type === "boolean" ? "false" : ""}
                render={({ field }) => {
                  if (question.type === "boolean") {
                    const checked = field.value === "true";
                    return (
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={checked}
                          onCheckedChange={(val) =>
                            field.onChange(String(val))
                          }
                        />
                        <span className="text-sm text-muted-foreground">
                          {checked ? "Yes" : "No"}
                        </span>
                      </div>
                    );
                  }

                  if (question.type === "scale") {
                    const numVal = parseInt(field.value) || 5;
                    return (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Low</span>
                          <span className="text-gold-400 font-semibold tabular-nums">
                            {numVal} / 10
                          </span>
                          <span>High</span>
                        </div>
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[numVal]}
                          onValueChange={([v]) => field.onChange(String(v))}
                        />
                      </div>
                    );
                  }

                  // Default: text input
                  return (
                    <Input
                      {...field}
                      placeholder="Your answer…"
                    />
                  );
                }}
              />
            </div>
          )}
        />
      ))}
    </div>
  );
}

