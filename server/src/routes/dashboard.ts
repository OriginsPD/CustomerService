import { Hono } from "hono";
import {
  getDashboardSummary,
  getTrends,
  getKeywords,
  getAILog,
  getInsights,
  getHourlyHeatmap,
  getSentimentByPurpose,
} from "../services/analytics.service.js";

export const dashboardRoutes = new Hono()

  // GET /api/dashboard/summary — Main dashboard aggregate
  .get("/summary", async (c) => {
    const summary = await getDashboardSummary();
    return c.json(summary);
  })

  // GET /api/dashboard/trends?days=30 — Time-series data
  .get("/trends", async (c) => {
    const days = Math.min(365, Math.max(1, parseInt(c.req.query("days") ?? "30", 10)));
    const trends = await getTrends(days);
    return c.json(trends);
  })

  // GET /api/dashboard/keywords — Keyword frequency from recent comments
  .get("/keywords", async (c) => {
    const keywords = await getKeywords();
    return c.json(keywords);
  })

  // GET /api/dashboard/ai-log?page=1&pageSize=20 — Paginated AI decision log
  .get("/ai-log", async (c) => {
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(c.req.query("pageSize") ?? "20", 10)));
    const result = await getAILog(page, pageSize);
    return c.json(result);
  })

  // GET /api/dashboard/insights — AI-generated operational insights
  .get("/insights", async (c) => {
    const insights = await getInsights();
    return c.json(insights);
  })

  // GET /api/dashboard/heatmap — 24-hr layout of queue arrivals
  .get("/heatmap", async (c) => {
    const data = await getHourlyHeatmap();
    return c.json(data);
  })

  // GET /api/dashboard/sentiment-purpose — Crosstab of feedback vs purpose
  .get("/sentiment-purpose", async (c) => {
    const data = await getSentimentByPurpose();
    return c.json(data);
  });
