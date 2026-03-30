/**
 * AI Service — Single boundary for all AI interactions.
 *
 * Integration: @anthropic-ai/sdk (claude-3-5-haiku-20241022)
 * When ANTHROPIC_API_KEY is not set, all functions fall back to
 * lightweight heuristics so the server still operates without AI.
 */

import { z } from "zod";
import type { DynamicQuestion } from "../db/schema.js";
import type { AIDecision } from "@vcc/shared";
import { logger } from "../lib/logger.js";

// ── Anthropic client (lazy singleton) ─────────────────────────────────────────

let _anthropic: import("@anthropic-ai/sdk").Anthropic | null = null;

async function getClient(): Promise<import("@anthropic-ai/sdk").Anthropic | null> {
  if (_anthropic) return _anthropic;
  if (!process.env.ANTHROPIC_API_KEY) {
    logger.warn("[AI] ANTHROPIC_API_KEY not set — using built-in heuristics.");
    return null;
  }
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    logger.info("[AI] Anthropic client initialised (claude-3-5-haiku-20241022).");
    return _anthropic;
  } catch (err) {
    logger.error("[AI] Failed to load @anthropic-ai/sdk", { error: (err as Error).message });
    return null;
  }
}

// ── Response schemas ──────────────────────────────────────────────────────────

const SentimentResponseSchema = z.object({
  sentiment: z.enum(["positive", "neutral", "negative"]),
  score: z.number().min(-1).max(1),
  thankYouMessage: z.string(),
});

const KeywordResponseSchema = z.array(
  z.object({
    word: z.string(),
    count: z.number(),
    sentiment: z.enum(["positive", "neutral", "negative"]),
  })
);

const AdaptiveDecisionsSchema = z.array(
  z.object({
    action: z.enum(["add_question", "remove_question", "retain"]),
    questionText: z.string().optional(),
    questionType: z.enum(["text", "boolean", "scale"]).optional(),
    questionId: z.string().optional(),
    reasoning: z.string(),
    confidenceLevel: z.number().min(0).max(1).optional(),
  })
);

const InsightsResponseSchema = z.array(
  z.object({
    type: z.enum(["warning", "info", "success"]),
    title: z.string(),
    description: z.string(),
    metric: z.string().optional(),
  })
);

// ── Helper ────────────────────────────────────────────────────────────────────

function safeParseJSON(raw: string): unknown {
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\n?/m, "")
      .replace(/\n?```$/m, "")
      .trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

async function callAI(prompt: string, maxTokens = 400): Promise<string | null> {
  const client = await getClient();
  if (!client) return null;

  try {
    const message = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    });
    const block = message.content[0];
    return block?.type === "text" ? block.text : null;
  } catch (err) {
    logger.error("[AI] API call failed", { error: (err as Error).message, stack: (err as Error).stack });
    return null;
  }
}

// ── Public AI functions ───────────────────────────────────────────────────────

/**
 * Analyzes customer feedback comment sentiment.
 * Called on each checkout submission (synchronous path).
 */
export async function analyzeSentiment(comment: string): Promise<{
  sentiment: "positive" | "neutral" | "negative";
  score: number;
  thankYouMessage: string;
}> {
  const prompt = `Analyze this customer feedback comment for a customer service office.
Return ONLY valid JSON (no markdown, no code fences):
{
  "sentiment": "positive" | "neutral" | "negative",
  "score": <number -1.0 to 1.0>,
  "thankYouMessage": "<one warm personalized sentence tailored to the sentiment>"
}

Comment: "${comment.replace(/"/g, '\\"')}"`;

  const raw = await callAI(prompt, 200);

  if (raw) {
    try {
      const parsed = safeParseJSON(raw);
      return SentimentResponseSchema.parse(parsed);
    } catch {
      // fall through to heuristic
    }
  }

  return sentimentHeuristic(comment);
}

/**
 * Generates adaptive question decisions based on 24h feedback batch.
 * Called by the 24h scheduler.
 */
export async function generateAdaptiveQuestions(
  feedbackBatch: Array<{ comment: string; rating: number; totalDurationMinutes: number; answers: Record<string, string> }>,
  existingQuestions: DynamicQuestion[]
): Promise<AIDecision[]> {
  if (feedbackBatch.length === 0) return [];

  const prompt = `You are managing dynamic feedback questions for a customer service office.

Recent feedback (last 24h, ${feedbackBatch.length} responses):
${JSON.stringify(feedbackBatch.slice(0, 20), null, 2)}

Current active questions (max 5 allowed):
${JSON.stringify(
  existingQuestions.map((q) => ({ id: q.id, text: q.text, type: q.type })),
  null,
  2
)}

Decide which questions to keep, remove, or add. Rules:
- Maximum 5 active questions total
- Remove: low engagement or repetitive answers
- Add: target emerging pain points or data gaps
- CRITICAL WAIT TIME RULE: If totalDurationMinutes is frequently high (e.g. > 15 mins), you MUST autonomously drop an existing question if necessary and add a dynamic feedback question specifically asking about their wait time experience.
- Keep reasoning concise and evidence-based

Return ONLY valid JSON array (no markdown):
[{ "action": "add_question"|"remove_question"|"retain", "questionText"?: string, "questionType"?: "text"|"boolean"|"scale", "questionId"?: string, "reasoning": string, "confidenceLevel": <0.0-1.0> }]`;

  const raw = await callAI(prompt, 800);

  if (raw) {
    try {
      const parsed = safeParseJSON(raw);
      return AdaptiveDecisionsSchema.parse(parsed) as AIDecision[];
    } catch {
      // fall through
    }
  }

  logger.info("[AI] Using no-op adaptive decisions (AI unavailable).");
  return [];
}

/**
 * Generates 3 random, diverse feedback questions on-demand.
 * Used by GET /api/questions/random.
 */
export async function generateRandomQuestions(): Promise<
  Array<{ text: string; type: "text" | "boolean" | "scale" }>
> {
  const prompt = `Generate exactly 3 diverse and engaging feedback questions for a customer service office to ask a client during checkout.
Rules:
- 1 question MUST be "scale" type (1-5 rating)
- 1 question MUST be "boolean" type (Yes/No)
- 1 question MUST be "text" type (Open-ended)
- Questions should be professional, concise, and vary each time (e.g. ask about staff friendliness, wait time, facility cleanliness, or ease of process).
- Return ONLY valid JSON array (no markdown):
[
  { "text": "Was our staff friendly today?", "type": "boolean" },
  { "text": "How would you rate the cleanliness of our waiting area?", "type": "scale" },
  { "text": "What is one thing we could do better next time?", "type": "text" }
]`;

  const raw = await callAI(prompt, 300);

  if (raw) {
    try {
      const parsed = safeParseJSON(raw);
      const schema = z.array(
        z.object({
          text: z.string(),
          type: z.enum(["text", "boolean", "scale"]),
        })
      );
      return schema.parse(parsed);
    } catch {
      // fall through
    }
  }

  const booleans = [
    "Was the staff helpful during your visit?",
    "Did you find the office easy to locate?",
    "Was your primary concern resolved today?",
    "Did our staff explain the process clearly?",
    "Would you recommend our service to others?"
  ];
  const scales = [
    "How satisfied are you with the speed of service?",
    "How would you rate the cleanliness of our facility?",
    "How easy was it to complete your check-in?",
    "How professional did you find our team?",
    "Overall, how would you rate your experience today?"
  ];
  const texts = [
    "Do you have any other comments or suggestions?",
    "What is one thing we could do better next time?",
    "Is there anyone from our team you'd like to recognize?",
    "Was there anything confusing about your visit?",
    "What was the highlight of your visit today?"
  ];

  const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

  return [
    { text: pick(booleans), type: "boolean" },
    { text: pick(scales), type: "scale" },
    { text: pick(texts), type: "text" },
  ];
}

/**
 * Extracts keyword frequency from feedback comments.
 * Used by the dashboard keywords endpoint.
 */
export async function extractKeywords(comments: string[]): Promise<
  Array<{ word: string; count: number; sentiment: "positive" | "neutral" | "negative" }>
> {
  if (comments.length === 0) return [];

  const prompt = `Analyze these customer feedback comments and extract the top 20 significant keywords.

Comments:
${comments.slice(0, 50).join("\n---\n")}

Return ONLY valid JSON array (no markdown):
[{ "word": string, "count": number, "sentiment": "positive"|"neutral"|"negative" }]

Focus on meaningful business terms. Exclude common stop words.`;

  const raw = await callAI(prompt, 500);

  if (raw) {
    try {
      const parsed = safeParseJSON(raw);
      return KeywordResponseSchema.parse(parsed);
    } catch {
      // fall through
    }
  }

  return keywordHeuristic(comments);
}

/**
 * Generates 3–5 operational insights from dashboard metrics.
 * Used by GET /api/dashboard/insights.
 */
export async function generateInsights(
  summary: {
    avgRating: number;
    positiveSentimentPct: number;
    currentQueueDepth: number;
    totalVisitsToday: number;
    sentimentDistribution: { positive: number; neutral: number; negative: number; total: number };
  },
  recentKeywords: Array<{ word: string; count: number; sentiment: string }>,
  trends: Array<{ date: string; avgRating: number; positiveCount: number; negativeCount: number; visitCount: number }>
): Promise<Array<{ type: "warning" | "info" | "success"; title: string; description: string; metric?: string }>> {
  const prompt = `You are a customer service operations analyst. Based on the following metrics, generate 3-5 actionable operational insights.

Dashboard Summary:
- Average Rating: ${summary.avgRating}/5
- Positive Sentiment: ${summary.positiveSentimentPct}%
- Current Queue Depth: ${summary.currentQueueDepth}
- Total Visits Today: ${summary.totalVisitsToday}
- Sentiment: ${summary.sentimentDistribution.positive} positive, ${summary.sentimentDistribution.neutral} neutral, ${summary.sentimentDistribution.negative} negative

Top Keywords (last 7 days): ${recentKeywords.slice(0, 10).map((k) => `${k.word} (${k.sentiment})`).join(", ")}

Recent Trend (last ${trends.length} data points):
${trends.slice(-7).map((t) => `${t.date}: rating=${t.avgRating}, +${t.positiveCount}/-${t.negativeCount}`).join("\n")}

Return ONLY valid JSON array (no markdown):
[{ "type": "warning"|"info"|"success", "title": "<8 words max>", "description": "<one actionable sentence>", "metric": "<optional short metric e.g. '4.2/5'>" }]

Focus on: staffing needs, satisfaction trends, recurring issues, improvement opportunities.`;

  const raw = await callAI(prompt, 600);

  if (raw) {
    try {
      const parsed = safeParseJSON(raw);
      return InsightsResponseSchema.parse(parsed);
    } catch {
      // fall through to heuristic
    }
  }

  return insightsHeuristic(summary, recentKeywords, trends);
}

// ── Heuristic implementations (no AI required) ────────────────────────────────

function insightsHeuristic(
  summary: {
    avgRating: number;
    positiveSentimentPct: number;
    currentQueueDepth: number;
    totalVisitsToday: number;
    sentimentDistribution: { positive: number; neutral: number; negative: number; total: number };
  },
  _keywords: Array<{ word: string; count: number; sentiment: string }>,
  trends: Array<{ date: string; avgRating: number; positiveCount: number; negativeCount: number; visitCount: number }>
): Array<{ type: "warning" | "info" | "success"; title: string; description: string; metric?: string }> {
  const insights: Array<{ type: "warning" | "info" | "success"; title: string; description: string; metric?: string }> = [];

  if (summary.currentQueueDepth > 5) {
    insights.push({
      type: "warning",
      title: "High Queue Depth",
      description: `${summary.currentQueueDepth} clients are currently waiting — consider allocating additional staff to reduce wait times.`,
      metric: `${summary.currentQueueDepth} waiting`,
    });
  }

  if (summary.sentimentDistribution.total > 0) {
    if (summary.avgRating < 3.5) {
      insights.push({
        type: "warning",
        title: "Below-Average Satisfaction",
        description: `Average rating of ${summary.avgRating}/5 indicates service quality concerns that need immediate attention.`,
        metric: `${summary.avgRating}/5`,
      });
    } else if (summary.avgRating >= 4.5) {
      insights.push({
        type: "success",
        title: "Excellent Customer Satisfaction",
        description: `Average rating of ${summary.avgRating}/5 reflects outstanding service quality — keep it up.`,
        metric: `${summary.avgRating}/5`,
      });
    }

    if (summary.positiveSentimentPct < 50) {
      insights.push({
        type: "warning",
        title: "Low Positive Sentiment",
        description: `Only ${summary.positiveSentimentPct}% of feedback is positive — review recent comments to identify recurring pain points.`,
        metric: `${summary.positiveSentimentPct}%`,
      });
    } else if (summary.positiveSentimentPct >= 75) {
      insights.push({
        type: "success",
        title: "Strong Positive Sentiment",
        description: `${summary.positiveSentimentPct}% of recent feedback is positive, indicating high client satisfaction.`,
        metric: `${summary.positiveSentimentPct}%`,
      });
    }
  }

  if (trends.length >= 4) {
    const recent = trends.slice(-3);
    const older = trends.slice(0, trends.length - 3);
    const recentAvg = recent.reduce((s, t) => s + t.avgRating, 0) / recent.length;
    const olderAvg = older.reduce((s, t) => s + t.avgRating, 0) / older.length;
    if (olderAvg > 0 && recentAvg < olderAvg - 0.3) {
      insights.push({
        type: "warning",
        title: "Declining Satisfaction Trend",
        description: `Ratings have dropped from ${olderAvg.toFixed(1)} to ${recentAvg.toFixed(1)} — investigate recent changes in service delivery.`,
        metric: `↓${(olderAvg - recentAvg).toFixed(1)} pts`,
      });
    }
  }

  if (summary.totalVisitsToday === 0) {
    insights.push({
      type: "info",
      title: "No Visits Recorded Today",
      description: "No clients have checked in today. Review availability hours or service promotion channels.",
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: "info",
      title: "System Operating Normally",
      description: "All metrics are within normal ranges. Continue monitoring for emerging trends.",
    });
  }

  return insights.slice(0, 5);
}

function sentimentHeuristic(comment: string): {
  sentiment: "positive" | "neutral" | "negative";
  score: number;
  thankYouMessage: string;
} {
  const lower = comment.toLowerCase();
  const wordMatch = (w: string) => new RegExp(`\\b${w}\\b`).test(lower);
  const pos = ["great", "excellent", "good", "happy", "satisfied", "love", "helpful", "fast", "amazing", "wonderful", "perfect", "outstanding"].filter(wordMatch).length;
  const neg = ["bad", "poor", "slow", "awful", "terrible", "unhappy", "disappointed", "wait", "rude", "worst", "horrible", "frustrating"].filter(wordMatch).length;

  const sentiment = pos > neg ? "positive" : neg > pos ? "negative" : "neutral";
  const score = pos > neg ? Math.min(0.9, pos * 0.3) : neg > pos ? Math.max(-0.9, neg * -0.3) : 0;

  const messages = {
    positive: "Thank you so much for your kind words — we're thrilled to hear about your positive experience!",
    neutral: "Thank you for your honest feedback — your insights help us continuously improve.",
    negative: "We're sorry to hear about your experience and appreciate you letting us know — we'll work hard to do better.",
  };

  return { sentiment, score: parseFloat(score.toFixed(2)), thankYouMessage: messages[sentiment] };
}

function keywordHeuristic(
  comments: string[]
): Array<{ word: string; count: number; sentiment: "positive" | "neutral" | "negative" }> {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
    "with", "by", "is", "was", "are", "were", "be", "been", "have", "has", "do",
    "did", "will", "would", "can", "could", "i", "me", "my", "you", "your",
    "we", "our", "they", "their", "it", "this", "that", "very", "so", "just",
    "also", "not", "no", "really", "quite", "more",
  ]);

  const positiveWords = new Set(["great", "excellent", "helpful", "fast", "friendly", "good", "amazing", "wonderful", "quick"]);
  const negativeWords = new Set(["slow", "wait", "long", "poor", "bad", "unhelpful", "rude", "frustrating", "disappointing"]);

  const freq = new Map<string, number>();
  for (const comment of comments) {
    const words = comment.toLowerCase().match(/\b[a-z]{3,}\b/g) ?? [];
    for (const word of words) {
      if (!stopWords.has(word)) freq.set(word, (freq.get(word) ?? 0) + 1);
    }
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({
      word,
      count,
      sentiment: positiveWords.has(word) ? "positive" : negativeWords.has(word) ? "negative" : "neutral",
    }));
}
