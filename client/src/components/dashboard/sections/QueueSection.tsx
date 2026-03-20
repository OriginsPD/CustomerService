import { QueueManagementPanel } from "../QueueManagementPanel";

export function QueueSection() {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Queue Management
      </h2>
      <QueueManagementPanel />
    </section>
  );
}
