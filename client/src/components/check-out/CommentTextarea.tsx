import { type UseFormRegister, type FieldError } from "react-hook-form";
import { type CheckOutForm } from "@vcc/shared";
import { Textarea } from "@/components/ui/textarea";
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
      ? "text-rose-400"
      : remaining <= 50
      ? "text-amber-400"
      : "text-muted-foreground";

  return (
    <div className="flex flex-col gap-1.5">
      <Textarea
        {...register("comment")}
        placeholder="Share your experience with us — what went well, what could be improved, and anything else you'd like us to know…"
        rows={5}
        className={cn(error && "border-rose-500/50")}
      />
      <div className="flex items-center justify-between">
        {error ? (
          <p className="text-xs text-rose-400">{error.message}</p>
        ) : count < MIN ? (
          <p className="text-xs text-muted-foreground">
            Minimum {MIN} characters required
          </p>
        ) : (
          <p className="text-xs text-emerald-400">Looks good!</p>
        )}
        <span className={cn("text-xs tabular-nums", counterColor)}>
          {count} / {MAX}
        </span>
      </div>
    </div>
  );
}
