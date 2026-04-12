import { type UseFormRegister, type FieldError } from "react-hook-form";
import { type CheckOutForm } from "@vcc/shared";
import { Textarea } from "@/components/ui/textarea";
import { AnimatedError } from "@/components/shared/AnimatedError";
import { cn } from "@/lib/utils";

const MIN = 10;
const MAX = 500;

interface CommentTextareaProps {
  register: UseFormRegister<CheckOutForm>;
  value: string;
  error?: FieldError;
}

export function CommentTextarea({ register, value, error }: CommentTextareaProps) {
  const count = value?.length ?? 0;
  const remaining = MAX - count;

  const counterColor =
    remaining <= 10
      ? "text-rose-400 font-bold"
      : remaining <= 50
      ? "text-amber-400 font-semibold"
      : "text-muted-foreground";

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        {...register("comment")}
        placeholder="Share your experience with us — what went well, what could be improved, and anything else you'd like us to know…"
        rows={5}
        className={cn(
          "bg-white/5 border-white/10 focus:border-amber-500/50 min-h-[120px] transition-all duration-300 resize-none",
          error && "border-rose-500/50 focus:border-rose-500/50"
        )}
      />
      
      <div className="flex items-center justify-between px-1">
        <div className="flex-1">
          <AnimatedError message={error?.message} />
          {!error && count < MIN && (
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              {MIN - count} more characters required
            </p>
          )}
          {!error && count >= MIN && (
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider animate-in fade-in">
              Validation Passed
            </p>
          )}
        </div>
        
        <span className={cn("text-[10px] font-mono tabular-nums bg-white/5 px-2 py-0.5 rounded-full border border-white/5", counterColor)}>
          {count} / {MAX}
        </span>
      </div>
    </div>
  );
}
