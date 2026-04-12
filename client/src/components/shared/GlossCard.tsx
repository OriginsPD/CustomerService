import { cn } from "@/lib/utils";

interface GlossCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function GlossCard({ children, className, glow }: GlossCardProps) {
  return (
    <div
      className={cn(
        "glass-card gloss-overlay p-6",
        glow && "glow-amber",
        className
      )}
    >
      {children}
    </div>
  );
}

