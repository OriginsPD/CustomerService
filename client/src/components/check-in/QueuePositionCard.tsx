import { motion } from "framer-motion";
import { Clock, Hash, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const isNext = queuePosition === 1;
  const waitText = estimatedWaitMinutes === 0 ? "You're next!" : `~${estimatedWaitMinutes} min wait`;

  return (
    <div className="relative group perspective-1000">
      {/* ── Outer Ambient Glow ── */}
      <motion.div 
        animate={{ 
          opacity: [0.1, 0.2, 0.1],
          scale: [1, 1.05, 1]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-amber-500/20 blur-[60px] rounded-full"
      />

      <div className="glass-card gloss-overlay p-8 relative z-10 overflow-hidden border-amber-500/20 flex flex-col items-center text-center">
        {/* ── The Amber Orbit ── */}
        <div className="relative h-48 w-48 mb-8">
          {/* Pulsing Core */}
          <motion.div 
            animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-4 rounded-full bg-gradient-to-br from-amber-500 to-gold-500 shadow-[0_0_40px_rgba(245,158,11,0.4)] flex flex-col items-center justify-center border border-white/20"
          >
            <span className="text-black text-[10px] font-black uppercase tracking-tighter opacity-60">Your Number</span>
            <span className="text-black text-5xl font-black tabular-nums leading-none">
              {String(queueNumber).padStart(2, "0")}
            </span>
          </motion.div>

          {/* Orbiting Dots (representing others in queue) */}
          {[...Array(Math.min(queuePosition - 1, 8))].map((_, i) => (
            <motion.div
              key={i}
              animate={{ rotate: 360 }}
              transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
            >
              <div 
                className="h-2 w-2 rounded-full bg-amber-400/40 absolute top-0 left-1/2 -translate-x-1/2"
                style={{ transform: `translateY(${i * 4}px)` }}
              />
            </motion.div>
          ))}

          {/* Rotating Ring */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/20"
          />
        </div>

        {/* ── Status Information ── */}
        <div className="space-y-1 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest"
          >
            {isNext ? <Sparkles className="h-3.5 w-3.5 animate-pulse" /> : <Users className="h-3.5 w-3.5" />}
            Position #{queuePosition}
          </motion.div>
          
          <h3 className={cn(
            "text-3xl font-black tracking-tight pt-2",
            isNext ? "gradient-text animate-pulse" : "text-foreground"
          )}>
            {isNext ? "Please Stand By" : "In the Queue"}
          </h3>
          
          <div className="flex items-center justify-center gap-2 text-muted-foreground pt-4">
            <Clock className="h-4 w-4 text-gold-500" />
            <span className="text-sm font-medium tracking-wide">{waitText}</span>
          </div>
        </div>

        {/* ── Bottom Decorative Bar ── */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
      </div>
    </div>
  );
}
