import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/AppShell";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

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
