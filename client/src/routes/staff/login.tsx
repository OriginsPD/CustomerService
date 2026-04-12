import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Lock, User, Loader2, ShieldCheck } from "lucide-react";
import { LoginSchema, type LoginForm } from "@vcc/shared";
import { auth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlossCard } from "@/components/shared/GlossCard";
import { AnimatedError } from "@/components/shared/AnimatedError";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/staff/login")({
  beforeLoad: () => {
    if (auth.isAuthenticated()) {
      throw redirect({ to: "/staff/dashboard" });
    }
  },
  component: StaffLoginPage,
});

function StaffLoginPage() {
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setAuthError(null);
    try {
      const result = await api.auth.login(data.username, data.password);
      auth.setSession(result.token, result.username, result.role, result.fullName);
      navigate({ to: "/staff/dashboard" });
    } catch (err: any) {
      setAuthError(err.message || "Invalid credentials — check username and password");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-vcc-gradient relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-amber-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-amber-600/10 blur-[120px]" />

      <div className="w-full max-w-[400px] animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-8 gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-gold-500 shadow-2xl shadow-amber-600/20 ring-1 ring-white/20">
            <ShieldCheck className="h-8 w-8 text-black" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black gradient-text">VCC Staff Portal</h1>
            <p className="text-sm text-muted-foreground font-medium">Access system console</p>
          </div>
        </div>

        <GlossCard className="p-8 border-white/5">
          {authError && (
            <div className="mb-6 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-center text-xs font-semibold text-rose-400 animate-in shake-2">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Username
              </Label>
              <div className="relative group">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-amber-400 transition-colors" />
                <Input
                  {...register("username")}
                  placeholder="System Identity"
                  className={cn(
                    "bg-white/5 border-white/10 pl-10 h-11 focus:ring-amber-500/20",
                    errors.username && "border-rose-500/50"
                  )}
                />
              </div>
              <AnimatedError message={errors.username?.message} />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Security Key
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-amber-400 transition-colors" />
                <Input
                  {...register("password")}
                  type="password"
                  placeholder="••••••••"
                  className={cn(
                    "bg-white/5 border-white/10 pl-10 h-11 focus:ring-amber-500/20",
                    errors.password && "border-rose-500/50"
                  )}
                />
              </div>
              <AnimatedError message={errors.password?.message} />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full btn-gradient mt-2 h-11 shadow-lg shadow-amber-500/20"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Authorise Access"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-[10px] text-muted-foreground/40 font-mono uppercase tracking-tighter">
            Hardware acceleration active · v1.4.3
          </p>
        </GlossCard>
      </div>
    </div>
  );
}
