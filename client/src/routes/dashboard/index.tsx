import { createFileRoute, redirect } from "@tanstack/react-router";

// /dashboard redirects to the new staff-only route.
export const Route = createFileRoute("/dashboard/")({
  beforeLoad: () => {
    throw redirect({ to: "/staff/dashboard" });
  },
  component: () => null,
});
