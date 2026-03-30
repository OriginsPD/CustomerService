import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { QrCode, Globe, ArrowRight } from "lucide-react";
import { MY_SESSION_KEY } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/home")({
  beforeLoad: () => {
    if (localStorage.getItem(MY_SESSION_KEY)) {
      throw redirect({ to: "/queue" });
    }
  },
  component: HomePage,
});

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-[#020817]">
      <svg
        className="absolute w-full h-full opacity-30 mix-blend-screen"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="grad1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.4)" />
            <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
          </radialGradient>
          <radialGradient id="grad2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.4)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
          </radialGradient>
        </defs>

        <circle cx="20%" cy="30%" r="50%" fill="url(#grad1)">
          <animate
            attributeName="cx"
            values="20%;80%;20%"
            dur="20s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cy"
            values="30%;70%;30%"
            dur="25s"
            repeatCount="indefinite"
          />
        </circle>

        <circle cx="80%" cy="70%" r="60%" fill="url(#grad2)">
          <animate
            attributeName="cx"
            values="80%;20%;80%"
            dur="25s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cy"
            values="70%;30%;70%"
            dur="20s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}

function HomePage() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full p-6 text-center overflow-hidden z-0">
      <AnimatedBackground />

      <div className="max-w-md mx-auto p-10 flex flex-col items-center gap-6 glass-card relative z-10 border border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-xl shadow-blue-500/30">
          <QrCode className="h-10 w-10 text-white" />
        </div>
        
        <div className="flex flex-col items-center text-center">
          <h1 className="text-3xl font-black gradient-text mb-3">Welcome</h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            Please scan the QR code located at the kiosk in our lobby to check in, join the virtual queue, and notify our staff of your arrival.
          </p>
          <Link to="/kiosk" className="w-full">
            <Button size="lg" className="w-full font-bold group">
              Go to Kiosk
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Rotating Globe Overlay */}
      <div className="absolute -bottom-32 -right-32 z-0 opacity-20 pointer-events-none mix-blend-screen">
        <Globe strokeWidth={1} className="w-[400px] h-[400px] text-blue-400 animate-[spin_60s_linear_infinite]" />
      </div>
    </div>
  );
}
