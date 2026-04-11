// @ts-nocheck
import { createFileRoute, redirect } from "@tanstack/react-router";
import { DAY_SESSION_KEY } from "@/lib/auth";
import { nanoid } from "nanoid";

export const Route = createFileRoute("/scan")({
  beforeLoad: () => {
    // Check if there is already a valid day pass
    const existing = localStorage.getItem(DAY_SESSION_KEY);
    if (!existing) {
      // Generate a new day pass (expires in 24 hours).
      // We store a JSON with token and timestamp
      const dayPass = {
        token: nanoid(),
        setAt: Date.now()
      };
      localStorage.setItem(DAY_SESSION_KEY, JSON.stringify(dayPass));
    } else {
      try {
        const pass = JSON.parse(existing);
        const ageHours = (Date.now() - pass.setAt) / (1000 * 60 * 60);
        if (ageHours > 24) {
          // Expired, create new
          const dayPass = {
            token: nanoid(),
            setAt: Date.now()
          };
          localStorage.setItem(DAY_SESSION_KEY, JSON.stringify(dayPass));
        }
      } catch (err) {
        // Corrupted, create new
        const dayPass = {
          token: nanoid(),
          setAt: Date.now()
        };
        localStorage.setItem(DAY_SESSION_KEY, JSON.stringify(dayPass));
      }
    }
    
    // Redirect to check-in
    throw redirect({ to: "/check-in" });
  },
  component: () => null,
});
