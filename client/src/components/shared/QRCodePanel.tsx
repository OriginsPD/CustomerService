import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

interface QRCodePanelProps {
  /** URL encoded in the QR. Defaults to window.location.origin + "/check-in" */
  url?: string;
  /** Extra class names for the wrapper */
  className?: string;
}

export function QRCodePanel({ url, className }: QRCodePanelProps) {
  const checkInUrl = url ?? `${window.location.origin}/scan`;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(checkInUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* QR code */}
      <div className="glass-card gloss-overlay p-5 rounded-2xl">
        <QRCodeSVG
          value={checkInUrl}
          size={220}
          level="M"
          bgColor="transparent"
          fgColor="#e2e8ff"
          className="block"
        />
      </div>

      {/* URL + copy */}
      <div className="flex items-center gap-2 w-full max-w-xs">
        <div className="flex-1 min-w-0 glass-card px-3 py-2 rounded-lg">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">
            Check-in URL
          </p>
          <p className="text-xs text-foreground font-mono truncate">{checkInUrl}</p>
        </div>
        <button
          onClick={handleCopy}
          title="Copy link"
          className={cn(
            "flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-lg border border-white/[0.08] transition-all duration-150",
            copied
              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
              : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground"
          )}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      {/* Instruction */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <QrCode className="h-4 w-4 text-gold-400" />
        <p className="text-xs">Clients scan this to check in</p>
      </div>
    </div>
  );
}

