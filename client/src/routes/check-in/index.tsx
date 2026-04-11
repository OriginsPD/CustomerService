import { createFileRoute, redirect } from "@tanstack/react-router";
import { CheckInForm } from "@/components/check-in/CheckInForm";
import { DAY_SESSION_KEY, MY_SESSION_KEY } from "@/lib/auth";

export const Route = createFileRoute("/check-in/")({
  // Require Day Pass to allow checking in;
  // Prevent double check-in: if the device already has an active session,
  // redirect straight to the queue instead of showing the form again.
  beforeLoad: () => {
    // 1. Verify device Day Pass
    const dayPass = localStorage.getItem(DAY_SESSION_KEY);
    if (!dayPass) {
      throw redirect({ to: "/kiosk" });
    }

    // 2. Check for active queuing session
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
