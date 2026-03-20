import { createFileRoute, redirect } from "@tanstack/react-router";
import { CheckInForm } from "@/components/check-in/CheckInForm";
import { MY_SESSION_KEY } from "@/lib/auth";

export const Route = createFileRoute("/check-in/")({
  // Prevent double check-in: if the device already has an active session,
  // redirect straight to the queue instead of showing the form again.
  beforeLoad: () => {
    if (localStorage.getItem(MY_SESSION_KEY)) {
      throw redirect({ to: "/queue" });
    }
  },
  component: CheckInPage,
});

function CheckInPage() {
  return (
    <div className="p-4 md:p-8">
      {/* Page header */}
      <div className="mb-6 md:mb-8 max-w-xl mx-auto">
        <h1 className="text-3xl font-black gradient-text mb-1">Client Check-In</h1>
        <p className="text-muted-foreground text-sm">
          Welcome to the Virtual Customer Care Office. Please fill in your details below.
        </p>
      </div>

      <CheckInForm />
    </div>
  );
}
