import { createRootRouteWithContext, Outlet, Link, ErrorComponentProps } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileQuestion } from "lucide-react";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
  errorComponent: GlobalError,
});

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-6">
        <FileQuestion className="h-8 w-8 text-cyan-400" />
      </div>
      <h1 className="text-3xl font-black gradient-text mb-2">Page Not Found</h1>
      <p className="text-muted-foreground max-w-sm mb-8">
        We couldn't find the page you're looking for. It might have been moved or doesn't exist.
      </p>
      <Link to="/home">
        <Button>Return Home</Button>
      </Link>
    </div>
  );
}

function GlobalError({ error, reset }: ErrorComponentProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 mb-6">
        <AlertCircle className="h-8 w-8 text-rose-400" />
      </div>
      <h1 className="text-3xl font-black gradient-text mb-2">Something went wrong</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        {error instanceof Error ? error.message : "An unexpected error occurred while loading this page."}
      </p>
      <Button onClick={reset} variant="outline" className="border-white/10 hover:bg-white/5">
        Try Again
      </Button>
    </div>
  );
}

function RootLayout() {
  return (
    <AppShell>
      <Outlet />
      {/* Global toast notifications — dark theme matching VCC palette */}
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "rgba(13,27,42,0.95)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#f0f4ff",
          },
        }}
      />
    </AppShell>
  );
}
