import { createFileRoute } from "@tanstack/react-router";
import { QuestionsSection } from "@/components/dashboard/sections/QuestionsSection";

export const Route = createFileRoute("/staff/dashboard/questions")({
  component: QuestionsSection,
});
