import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsSection } from "@/components/dashboard/sections/AnalyticsSection";

export const Route = createFileRoute("/staff/dashboard/analytics")({
  component: AnalyticsSection,
});
