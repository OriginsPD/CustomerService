import { createFileRoute, Link } from "@tanstack/react-router";
import { GlossCard } from "@/components/shared/GlossCard";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/$")({
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <GlossCard className="max-w-sm w-full text-center">
        <p className="text-7xl font-black gradient-text mb-2">404</p>
        <h1 className="text-xl font-bold text-foreground mb-1">Page not found</h1>
        <p className="text-sm text-muted-foreground mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
            Go back
          </Button>
          <Button size="sm" asChild>
            <Link to="/check-in">
              <Home className="h-4 w-4" />
              Check-In
            </Link>
          </Button>
        </div>
      </GlossCard>
    </div>
  );
}
