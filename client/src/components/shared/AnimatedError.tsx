import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface AnimatedErrorProps {
  message?: string;
}

export function AnimatedError({ message }: AnimatedErrorProps) {
  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.div
          initial={{ opacity: 0, height: 0, x: -4 }}
          animate={{ 
            opacity: 1, 
            height: "auto", 
            x: [0, -4, 4, -4, 4, 0] // Shake animation
          }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ 
            height: { duration: 0.2 },
            x: { duration: 0.4, ease: "easeInOut" }
          }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-1.5 mt-1 text-rose-400 text-[11px] font-semibold tracking-tight">
            <AlertCircle className="h-3 w-3" />
            <span>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
