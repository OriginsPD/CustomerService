import { QuestionManagementPanel } from "../QuestionManagementPanel";

export function QuestionsSection() {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Feedback Questions
      </h2>
      <QuestionManagementPanel />
    </section>
  );
}
