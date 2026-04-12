import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number to a fixed decimal string */
export function formatDecimal(value: number, decimals = 1): string {
  return value.toFixed(decimals);
}

/** Format a date string to a readable label */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Format a datetime to relative time */
export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

/** Get sentiment badge variant */
export function getSentimentColor(
  sentiment: "positive" | "neutral" | "negative"
): string {
  return {
    positive: "text-gold-400",
    neutral: "text-amber-400",
    negative: "text-rose-400",
  }[sentiment];
}

/** Get action badge color for AI log */
export function getActionColor(
  action: "add_question" | "remove_question" | "retain"
): string {
  return {
    add_question: "text-emerald-400",
    remove_question: "text-rose-400",
    retain: "text-amber-400",
  }[action];
}

