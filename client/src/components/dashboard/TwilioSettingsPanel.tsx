import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquareText, Save, Loader2, Key, Phone, UserCircle } from "lucide-react";
import { api } from "@/lib/api";
import { TwilioConfigSchema, type TwilioConfig } from "@vcc/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlossCard } from "@/components/shared/GlossCard";
import { AnimatedError } from "@/components/shared/AnimatedError";
import { cn } from "@/lib/utils";

export function TwilioSettingsPanel() {
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TwilioConfig>({
    resolver: zodResolver(TwilioConfigSchema),
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin", "settings", "twilio_config"],
    queryFn: () => api.admin.getSettings("twilio_config"),
  });

  useEffect(() => {
    if (settings?.config) {
      reset(settings.config);
    }
  }, [settings, reset]);

  const mutation = useMutation({
    mutationFn: (config: TwilioConfig) => 
      api.admin.updateSettings("twilio_config", config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings", "twilio_config"] });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const onSubmit = (data: TwilioConfig) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-lg shadow-amber-500/10">
          <MessageSquareText className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-black gradient-text">Twilio SMS Engine</h2>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            Communication Infrastructure
          </p>
        </div>
      </div>

      <GlossCard className="p-8 border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-gold-500 opacity-20" />
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <div className="space-y-5">
            {/* Account SID */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                <UserCircle className="h-3 w-3" /> Account SID
              </Label>
              <Input
                {...register("accountSid")}
                placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className={cn(
                  "bg-white/5 border-white/10 font-mono text-sm h-11 focus:ring-amber-500/20",
                  errors.accountSid && "border-rose-500/50"
                )}
              />
              <AnimatedError message={errors.accountSid?.message} />
            </div>

            {/* Auth Token */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                <Key className="h-3 w-3" /> Auth Token
              </Label>
              <Input
                {...register("authToken")}
                type="password"
                placeholder="••••••••••••••••••••••••••••••••"
                className={cn(
                  "bg-white/5 border-white/10 font-mono text-sm h-11 focus:ring-amber-500/20",
                  errors.authToken && "border-rose-500/50"
                )}
              />
              <AnimatedError message={errors.authToken?.message} />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                <Phone className="h-3 w-3" /> Twilio Phone Number
              </Label>
              <Input
                {...register("phoneNumber")}
                placeholder="+18885550000"
                className={cn(
                  "bg-white/5 border-white/10 font-mono text-sm h-11 focus:ring-amber-500/20",
                  errors.phoneNumber && "border-rose-500/50"
                )}
              />
              <AnimatedError message={errors.phoneNumber?.message} />
              <p className="text-[10px] text-muted-foreground/60 italic ml-1">
                E.164 format strictly required for global routing
              </p>
            </div>
          </div>

          <div className="pt-6 flex items-center justify-between border-t border-white/5">
            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-tight">
              {settings?.updatedAt && (
                <span>Revision: {new Date(settings.updatedAt).toLocaleDateString()} {new Date(settings.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              )}
            </div>
            
            <Button 
              type="submit" 
              disabled={mutation.isPending || isSubmitting}
              className={cn(
                "min-w-[160px] h-11 font-bold shadow-lg transition-all duration-500",
                success ? "bg-emerald-600 hover:bg-emerald-600 shadow-emerald-500/20" : "btn-gradient shadow-amber-500/20"
              )}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Syncing...
                </>
              ) : success ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Config Synced
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </form>
      </GlossCard>

      {/* Security Warning */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          <p className="font-black uppercase tracking-widest text-[10px] text-amber-400">Security Protocol</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Sensitive credentials are encrypted at rest. Updating these parameters will immediately override environment variables for all subsequent outbound SMS traffic.
        </p>
      </div>
    </div>
  );
}
