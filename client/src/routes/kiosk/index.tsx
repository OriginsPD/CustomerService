import { createFileRoute } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { Brain, Wifi, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/kiosk/")({
  component: KioskPage,
});

function KioskPage() {
  const checkInUrl = `${window.location.origin}/scan`;
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const publicHost = import.meta.env.VITE_PUBLIC_HOST as string | undefined;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-3xl" />
      </div>

      {/* Localhost warning */}
      {isLocalhost && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-300">
                Phones cannot reach localhost
              </p>
              <p className="text-[11px] text-amber-400/80 mt-0.5">
                Open this page at{" "}
                <span className="font-mono font-bold">
                  {publicHost
                    ? `http://${publicHost}:5173/kiosk`
                    : "your machine's LAN IP"}
                </span>{" "}
                so clients can scan the QR.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-xl shadow-blue-500/30">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <div className="text-left">
            <p className="text-2xl font-black gradient-text tracking-wide">VCC</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              Customer Care
            </p>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black gradient-text">Check In Here</h1>
          <p className="text-muted-foreground text-base max-w-xs">
            Scan the QR code with your phone to join the queue
          </p>
        </div>

        {/* QR code */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-3xl bg-blue-500/20 blur-2xl scale-110" />
          <div className="relative glass-card gloss-overlay p-8 rounded-3xl">
            <QRCodeSVG
              value={checkInUrl}
              size={280}
              level="M"
              bgColor="transparent"
              fgColor="#e2e8ff"
              className="block"
            />
          </div>
        </div>

        {/* URL label */}
        <div className="flex items-center gap-2 text-muted-foreground/70">
          <Wifi className="h-4 w-4" />
          <p className="text-sm font-mono">{checkInUrl}</p>
        </div>

        {/* Footer hint */}
        <p className="text-xs text-muted-foreground/50 max-w-xs">
          Your session is saved on your device — you can close and rescan anytime
          to resume where you left off.
        </p>
      </div>
    </div>
  );
}
