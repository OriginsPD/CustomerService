import { createFileRoute, redirect } from "@tanstack/react-router";
import { CheckOutFormComponent } from "@/components/check-out/CheckOutForm";
import { activeQuestionsQueryOptions } from "@/hooks/useAIQuestions";
import { useAILog } from "@/hooks/useDashboard";
import { api } from "@/lib/api";
import { MY_SESSION_KEY } from "@/lib/auth";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/check-out/$sessionId")({
  // Ownership check: the stored session ID must match the URL param.
  // This prevents accessing another client's checkout page and blocks
  // any visitor without an active session.
  beforeLoad: ({ params }) => {
    const storedId = localStorage.getItem(MY_SESSION_KEY);
    if (!storedId || storedId !== params.sessionId) {
      throw redirect({ to: "/kiosk" });
    }
  },

  // Verify session exists AND pre-fetch active questions before rendering.
  // An invalid / already-completed sessionId redirects to /kiosk.
  loader: async ({ params, context: { queryClient } }) => {
    const session = await api.checkIn.getById(params.sessionId).catch(() => null);
    if (!session || (session as any).error) {
      throw redirect({ to: "/kiosk" });
    }
    // Redirect if session is cancelled
    const status = (session as any).status as string;
    if (status === "cancelled") {
      throw redirect({ to: "/kiosk" });
    }

    // Redirect if feedback is already submitted
    const feedback = await api.checkOut.getBySession(params.sessionId).catch(() => null);
    if (feedback && !(feedback as any).error) {
      localStorage.removeItem(MY_SESSION_KEY);
      throw redirect({ to: "/kiosk" });
    }
    await queryClient.ensureQueryData(activeQuestionsQueryOptions());
  },

  component: CheckOutPage,
});

function CheckOutPage() {
  const { sessionId } = Route.useParams();
  const { data: aiLog } = useAILog(1);

  // Show banner if AI made a recent question change (last add or remove action)
  const recentChange = aiLog?.data.find(
    (e) => e.action === "add_question" || e.action === "remove_question"
  );

  return (
    <div className="p-8">
      <div className="mb-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-black gradient-text mb-1">Client Check-Out</h1>
        <p className="text-muted-foreground text-sm">
          Thank you for visiting. Please take a moment to rate your experience.
        </p>

        {recentChange && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] px-4 py-3">
            <Sparkles className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
            <p className="text-sm text-cyan-200/80 leading-relaxed">
              Based on recent visitor feedback, we've updated our questions to better
              understand your experience.
            </p>
          </div>
        )}
      </div>

      <CheckOutFormComponent sessionId={sessionId} />
    </div>
  );
}
