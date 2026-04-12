import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-amber-500 to-gold-500 text-white shadow",
        secondary: "border-white/10 bg-white/5 text-foreground/80",
        destructive: "border-transparent bg-destructive/20 text-rose-400",
        outline: "border-white/20 text-foreground/70",
        positive: "border-transparent bg-gold-500/20 text-gold-400",
        neutral: "border-transparent bg-amber-600/20 text-amber-400",
        negative: "border-transparent bg-rose-500/20 text-rose-400",
        add: "border-transparent bg-emerald-500/20 text-emerald-400",
        remove: "border-transparent bg-rose-500/20 text-rose-400",
        retain: "border-transparent bg-amber-600/20 text-amber-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

