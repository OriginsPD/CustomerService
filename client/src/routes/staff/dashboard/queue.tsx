import { createFileRoute } from "@tanstack/react-router";
import { QueueSection } from "@/components/dashboard/sections/QueueSection";

export const Route = createFileRoute("/staff/dashboard/queue")({
  component: QueueSection,
});
