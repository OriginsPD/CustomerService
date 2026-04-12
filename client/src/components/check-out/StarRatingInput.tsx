import { useState } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { type Control, Controller } from "react-hook-form";
import { starLabels, type CheckOutForm } from "@vcc/shared";
import { cn } from "@/lib/utils";
import { AnimatedError } from "@/components/shared/AnimatedError";

interface StarRatingInputProps {
  control: Control<CheckOutForm>;
  name: "rating";
  error?: string;
}

export function StarRatingInput({ control, name, error }: StarRatingInputProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const activeValue = hovered ?? field.value ?? 0;
        const label = activeValue > 0 ? starLabels[activeValue] : "Select your rating";

        return (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 p-2 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => field.onChange(star)}
                    className="focus:outline-none relative group"
                    aria-label={starLabels[star]}
                  >
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 15 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-1"
                    >
                      <Star
                        className={cn(
                          "h-8 w-8 transition-all duration-300",
                          star <= activeValue
                            ? "fill-amber-500 text-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                            : "text-white/10 fill-transparent group-hover:text-white/30"
                        )}
                      />
                    </motion.div>
                  </button>
                ))}
              </div>

              {/* Status Label */}
              <motion.span
                initial={false}
                animate={{ 
                  color: activeValue > 0 ? "#f59e0b" : "#78716c",
                  opacity: activeValue > 0 ? 1 : 0.6,
                  x: activeValue > 0 ? 0 : -5
                }}
                className="ml-2 text-sm font-black uppercase tracking-widest tabular-nums"
              >
                {label}
              </motion.span>
            </div>

            <AnimatedError message={error} />
          </div>
        );
      }}
    />
  );
}
