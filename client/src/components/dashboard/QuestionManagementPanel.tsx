import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  PlusCircle,
  Trash2,
  Bot,
  Hand,
  Loader2,
} from "lucide-react";
import { GlossCard } from "@/components/shared/GlossCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryClient";
import type { DynamicQuestion } from "@vcc/shared";

export function QuestionManagementPanel() {
  const queryClient = useQueryClient();
  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState<"text" | "boolean" | "scale">("text");

  const { data: questions = [], isLoading } = useQuery({
    queryKey: queryKeys.activeQuestions(),
    queryFn: () => api.questions.active() as Promise<DynamicQuestion[]>,
  });

  const addQuestion = useMutation({
    mutationFn: () => api.questions.add({ text: newText.trim(), type: newType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activeQuestions() });
      setNewText("");
      setNewType("text");
    },
  });

  const deactivateQuestion = useMutation({
    mutationFn: (id: string) => api.questions.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activeQuestions() });
    },
  });

  const handleAdd = () => {
    if (newText.trim().length >= 5) addQuestion.mutate();
  };

  const typeLabel: Record<string, string> = {
    text: "Free text",
    boolean: "Yes / No",
    scale: "Scale 1–5",
  };

  return (
    <GlossCard className="p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-foreground">
            Feedback Questions
          </h2>
          {!isLoading && (
            <span className="ml-1 rounded-full bg-cyan-500/20 px-2 py-0.5 text-[11px] font-medium text-cyan-300">
              {questions.length} / 5 active
            </span>
          )}
        </div>
      </div>

      {/* Question list */}
      <div className="divide-y divide-white/[0.04]">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-12 mx-4 my-3 rounded-lg shimmer" />
          ))
        ) : questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">No active questions</p>
          </div>
        ) : (
          questions.map((q) => (
            <div
              key={q.id}
              className="flex items-start justify-between gap-4 px-6 py-3.5 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                {q.source === "ai_generated" ? (
                  <Bot className="h-3.5 w-3.5 mt-0.5 shrink-0 text-cyan-400" />
                ) : (
                  <Hand className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-400" />
                )}
                <div className="min-w-0">
                  <p className="text-sm text-foreground leading-snug">{q.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px] py-0">
                      {typeLabel[q.type] ?? q.type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {q.source === "ai_generated" ? "AI" : "Manual"}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                onClick={() => deactivateQuestion.mutate(q.id)}
                disabled={deactivateQuestion.isPending}
                title="Remove question"
              >
                {deactivateQuestion.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Add question form */}
      <div className="px-6 py-4 border-t border-white/[0.06] space-y-3">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
          Add question
        </p>
        <div className="flex gap-2">
          <Input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Enter question text (min 5 chars)…"
            className="flex-1 h-8 text-sm"
            maxLength={200}
            disabled={questions.length >= 5}
          />
          <Select
            value={newType}
            onValueChange={(v) => setNewType(v as typeof newType)}
            disabled={questions.length >= 5}
          >
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Free text</SelectItem>
              <SelectItem value="boolean">Yes / No</SelectItem>
              <SelectItem value="scale">Scale 1–5</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="h-8 text-xs"
            onClick={handleAdd}
            disabled={
              newText.trim().length < 5 ||
              questions.length >= 5 ||
              addQuestion.isPending
            }
          >
            {addQuestion.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <PlusCircle className="h-3.5 w-3.5" />
            )}
            Add
          </Button>
        </div>
        {questions.length >= 5 && (
          <p className="text-xs text-amber-400/80">
            Maximum of 5 questions reached. Remove one before adding another.
          </p>
        )}
        {addQuestion.isError && (
          <p className="text-xs text-rose-400">
            {(addQuestion.error as Error)?.message ?? "Failed to add question."}
          </p>
        )}
      </div>
    </GlossCard>
  );
}
