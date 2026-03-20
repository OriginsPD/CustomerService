import { useState } from "react";
import { Star } from "lucide-react";
import { type Control, Controller } from "react-hook-form";
import { starLabels, type CheckOutForm } from "@vcc/shared";
import { cn } from "@/lib/utils";

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
        const label = activeValue > 0 ? starLabels[activeValue] : null;

        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => field.onChange(star)}
                  className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                  aria-label={starLabels[star]}
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-all duration-150",
                      star <= activeValue
                        ? "fill-current text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]"
                        : "text-white/20 fill-transparent"
                    )}
                  />
                </button>
              ))}

              {/* Hover / selected label */}
              <span
                className={cn(
                  "ml-2 text-sm font-medium transition-all duration-150",
                  activeValue > 0 ? "text-cyan-400 opacity-100" : "opacity-0"
                )}
              >
                {label}
              </span>
            </div>

            {error && (
              <p className="text-xs text-rose-400">{error}</p>
            )}
          </div>
        );
      }}
    />
  );
}
