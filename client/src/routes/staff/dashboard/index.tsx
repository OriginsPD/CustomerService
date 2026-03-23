import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/staff/dashboard/")({
  beforeLoad: () => {
    throw redirect({ to: "/staff/dashboard/queue" });
  },
});
