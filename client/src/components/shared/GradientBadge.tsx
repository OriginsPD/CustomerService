import { cn } from "@/lib/utils";

interface GradientBadgeProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function GradientBadge({
  children,
  className,
  size = "md",
}: GradientBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-semibold rounded-lg",
        "bg-gradient-to-r from-blue-600 to-cyan-500 text-white",
        "shadow-lg shadow-blue-500/25",
        {
          "px-2 py-0.5 text-xs": size === "sm",
          "px-3 py-1 text-sm": size === "md",
          "px-4 py-1.5 text-base": size === "lg",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
