import { Clock, Hash, Users } from "lucide-react";

interface QueuePositionCardProps {
  queueNumber: number;
  queuePosition: number;
  estimatedWaitMinutes: number;
}

export function QueuePositionCard({
  queueNumber,
  queuePosition,
  estimatedWaitMinutes,
}: QueuePositionCardProps) {
  const waitText =
    estimatedWaitMinutes === 0
      ? "You're next!"
      : `~${estimatedWaitMinutes} min wait`;

  return (
    <div className="glass-card gloss-overlay p-4 animate-pulse-glow">
      {/* Queue number — large display */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-cyan-400" />
          <span className="text-xs text-muted-foreground uppercase tracking-widest">
            Queue Number
          </span>
        </div>
        <span className="text-3xl font-black gradient-text tabular-nums">
          {String(queueNumber).padStart(3, "0")}
        </span>
      </div>

      <div className="h-px bg-white/[0.06] my-3" />

      {/* Position and wait time */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-400" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Position
            </p>
            <p className="text-lg font-bold text-foreground tabular-nums">
              #{queuePosition}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-cyan-400" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Est. Wait
            </p>
            <p className="text-sm font-semibold text-foreground">{waitText}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
