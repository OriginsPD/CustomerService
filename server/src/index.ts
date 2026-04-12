import { env } from "./env.js";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { nanoid } from "nanoid";
import { logger } from "./lib/logger.js";
import { checkinRoutes } from "./routes/checkin.js";
import { checkoutRoutes } from "./routes/checkout.js";
import { queueRoutes } from "./routes/queue.js";
import { questionRoutes } from "./routes/questions.js";
import { feedbackRoutes } from "./routes/feedback.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { adminRoutes } from "./routes/admin.js";
import { authRoutes } from "./routes/auth.js";
import { initQueueMap } from "./services/queue.service.js";
import { startScheduler } from "./services/scheduler.service.js";

const PORT = env.PORT;
const CLIENT_URL = env.CLIENT_URL;

const app = new Hono();

app.use("*", honoLogger());

// ── Request-ID middleware — stamps every request with a unique ID ─────────────
// The ID is returned in X-Request-Id so it can be correlated in Docker logs.
app.use("*", async (c, next) => {
  const requestId = nanoid(10);
  c.set("requestId" as any, requestId);
  c.header("X-Request-Id", requestId);
  const start = Date.now();
  await next();
  logger.info(`${c.req.method} ${c.req.path}`, {
    requestId,
    status: c.res.status,
    ms: Date.now() - start,
  });
});

app.use(
  "*",
  cors({
    origin: [CLIENT_URL, "http://localhost:5173"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Admin-Key"],
    credentials: true,
  })
);

// Health check at root — Docker health check tests /health (not /api/health)
app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// API routes mounted at /api
const api = new Hono()
  .route("/auth", authRoutes)
  .route("/checkin", checkinRoutes)
  .route("/checkout", checkoutRoutes)
  .route("/queue", queueRoutes)
  .route("/questions", questionRoutes)
  .route("/feedback", feedbackRoutes)
  .route("/dashboard", dashboardRoutes)
  .route("/admin", adminRoutes);

app.route("/api", api);

// ── Global error boundary — catches any unhandled thrown errors in routes ─────
app.onError((err, c) => {
  logger.error("Unhandled route error", {
    path: c.req.path,
    method: c.req.method,
    error: err.message,
    stack: err.stack,
  });
  return c.json({ error: "Internal server error" }, 500);
});

// ── Process-level safety nets ─────────────────────────────────────────────────
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason: String(reason) });
});
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", { error: err.message, stack: err.stack });
  process.exit(1);
});

export type AppType = typeof app;

// Bootstrap
async function bootstrap() {
  try {
    // Initialize in-memory queue map from DB
    await initQueueMap();

    // Start 24h AI analysis scheduler
    startScheduler();

    serve({ fetch: app.fetch, port: PORT }, () => {
      logger.info(`VCC Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error("Failed to start server", { error: (err as Error).message, stack: (err as Error).stack });
    process.exit(1);
  }
}

bootstrap();
