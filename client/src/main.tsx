import { StrictMode, Component, type ReactNode, type ErrorInfo } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { router } from "@/router";
import "@/styles/globals.css";

// ── Global error boundary — prevents a render crash from showing a blank page ─
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[VCC] Unhandled render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="glass-card gloss-overlay max-w-md w-full p-8 text-center">
            <div className="gradient-text text-4xl font-black mb-2">VCC</div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {(this.state.error as Error).message}
            </p>
            <button
              className="btn-gradient px-6 py-2 rounded-lg text-sm font-medium"
              onClick={() => { this.setState({ error: null }); window.location.href = "/"; }}
            >
              Return to Check-In
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} context={{ queryClient }} />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
