import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Brain, Lock, User, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { api } from "@/lib/api";
import { GlossCard } from "@/components/shared/GlossCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/staff/login")({
  // If already logged in, skip straight to the dashboard
  beforeLoad: () => {
    if (auth.isAuthenticated()) {
      throw redirect({ to: "/staff/dashboard" });
    }
  },
  component: StaffLoginPage,
});

const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof LoginSchema>;

function StaffLoginPage() {
  const navigate = useNavigate();
  const [authError, setAuthError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = async (data: LoginForm) => {
    try {
      const result = await api.auth.login(data.username, data.password);
      auth.setSession(result.token, result.username);
      navigate({ to: "/staff/dashboard" });
    } catch {
      setAuthError("Invalid credentials — check username and password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 mb-10">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-xl shadow-blue-500/30">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow">
              <ShieldCheck className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black gradient-text">Staff Portal</h1>
            <p className="text-sm text-muted-foreground mt-1">
              VCC — Virtual Customer Care
            </p>
          </div>
        </div>

        <GlossCard className="gloss-overlay">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {authError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                {authError}
              </div>
            )}

            {/* Username */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="username"
                  {...register("username")}
                  className="pl-9"
                  placeholder="admin"
                  autoComplete="username"
                  autoFocus
                />
              </div>
              {errors.username && (
                <p className="text-xs text-rose-400">{errors.username.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  className="pl-9"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-rose-400">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              Sign In to Dashboard
            </Button>
          </form>

          <p className="mt-5 text-center text-[11px] text-muted-foreground/40">
            Demo credentials · admin / vcc2024
          </p>
        </GlossCard>
      </div>
    </div>
  );
}
