import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ────────────────────────────────────────────────────────────────────

export const sessionStatusEnum = pgEnum("session_status", [
  "waiting",
  "in_progress",
  "completed",
  "cancelled",
]);

export const sentimentEnum = pgEnum("sentiment_type", [
  "positive",
  "neutral",
  "negative",
]);

export const questionTypeEnum = pgEnum("question_type", [
  "text",
  "boolean",
  "scale",
]);

export const questionSourceEnum = pgEnum("question_source", [
  "ai_generated",
  "manual",
]);

export const aiActionEnum = pgEnum("ai_action", [
  "add_question",
  "remove_question",
  "retain",
  "no_change",
]);

// ── Sessions (Check-In records) ──────────────────────────────────────────────

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    company: text("company"),
    purpose: text("purpose").notNull(),
    queueNumber: integer("queue_number").notNull(),
    status: sessionStatusEnum("status").notNull().default("waiting"),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    calledUpAt: timestamp("called_up_at", { withTimezone: true }),
    checkedOutAt: timestamp("checked_out_at", { withTimezone: true }),
  },
  (t) => ({
    emailIdx: index("sessions_email_idx").on(t.email),
    statusIdx: index("sessions_status_idx").on(t.status),
    statusQueueIdx: index("sessions_status_queue_idx").on(
      t.status,
      t.queueNumber
    ),
    dateIdx: index("sessions_date_idx").on(t.checkedInAt),
  })
);

// ── Feedback (Check-Out submissions) ─────────────────────────────────────────

export const feedback = pgTable(
  "feedback",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull(),
    sentiment: sentimentEnum("sentiment"),
    sentimentScore: real("sentiment_score"),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    sessionIdIdx: index("feedback_session_id_idx").on(t.sessionId),
    sentimentIdx: index("feedback_sentiment_idx").on(t.sentiment),
    ratingIdx: index("feedback_rating_idx").on(t.rating),
    dateIdx: index("feedback_submitted_at_idx").on(t.submittedAt),
    uniqueSession: uniqueIndex("feedback_session_unique_idx").on(t.sessionId),
  })
);

// ── Feedback Answers (Dynamic question responses) ─────────────────────────────

export const feedbackAnswers = pgTable(
  "feedback_answers",
  {
    id: text("id").primaryKey(),
    feedbackId: text("feedback_id")
      .notNull()
      .references(() => feedback.id, { onDelete: "cascade" }),
    questionId: text("question_id")
      .notNull()
      .references(() => dynamicQuestions.id, { onDelete: "cascade" }),
    answer: text("answer").notNull(),
  },
  (t) => ({
    feedbackIdx: index("answers_feedback_id_idx").on(t.feedbackId),
    questionIdx: index("answers_question_id_idx").on(t.questionId),
    compositeIdx: uniqueIndex("answers_composite_idx").on(
      t.feedbackId,
      t.questionId
    ),
  })
);

// ── Dynamic Questions (AI-managed form questions) ─────────────────────────────

export const dynamicQuestions = pgTable(
  "dynamic_questions",
  {
    id: text("id").primaryKey(),
    text: text("text").notNull(),
    type: questionTypeEnum("type").notNull().default("text"),
    isActive: boolean("is_active").notNull().default(true),
    source: questionSourceEnum("source").notNull().default("manual"),
    displayOrder: integer("display_order").notNull().default(0),
    addedAt: timestamp("added_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    removedAt: timestamp("removed_at", { withTimezone: true }),
  },
  (t) => ({
    activeIdx: index("questions_active_idx").on(t.isActive),
    orderIdx: index("questions_order_idx").on(t.displayOrder),
    activeOrderIdx: index("questions_active_order_idx").on(
      t.isActive,
      t.displayOrder
    ),
  })
);

// ── AI Decision Log (Full audit trail) ───────────────────────────────────────

export const aiDecisionLog = pgTable(
  "ai_decision_log",
  {
    id: text("id").primaryKey(),
    runAt: timestamp("run_at", { withTimezone: true }).notNull().defaultNow(),
    action: aiActionEnum("action").notNull(),
    questionId: text("question_id").references(() => dynamicQuestions.id),
    questionText: text("question_text"),
    reasoning: text("reasoning").notNull(),
    feedbackSampleSize: integer("feedback_sample_size").notNull(),
    rawAiResponse: jsonb("raw_ai_response"),
  },
  (t) => ({
    runAtIdx: index("ai_log_run_at_idx").on(t.runAt),
    actionIdx: index("ai_log_action_idx").on(t.action),
  })
);

// ── Cancellation Feedback ─────────────────────────────────────────────────────

export const cancellationFeedback = pgTable(
  "cancellation_feedback",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    wouldReschedule: boolean("would_reschedule").notNull().default(false),
    additionalComment: text("additional_comment"),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    sessionIdIdx: uniqueIndex("cancellation_session_id_idx").on(t.sessionId),
  })
);

// ── Relations ─────────────────────────────────────────────────────────────────

export const sessionsRelations = relations(sessions, ({ one }) => ({
  feedback: one(feedback, {
    fields: [sessions.id],
    references: [feedback.sessionId],
  }),
}));

export const feedbackRelations = relations(feedback, ({ one, many }) => ({
  session: one(sessions, {
    fields: [feedback.sessionId],
    references: [sessions.id],
  }),
  answers: many(feedbackAnswers),
}));

export const feedbackAnswersRelations = relations(
  feedbackAnswers,
  ({ one }) => ({
    feedback: one(feedback, {
      fields: [feedbackAnswers.feedbackId],
      references: [feedback.id],
    }),
    question: one(dynamicQuestions, {
      fields: [feedbackAnswers.questionId],
      references: [dynamicQuestions.id],
    }),
  })
);

export const dynamicQuestionsRelations = relations(
  dynamicQuestions,
  ({ many }) => ({
    answers: many(feedbackAnswers),
    aiLogs: many(aiDecisionLog),
  })
);

export const aiDecisionLogRelations = relations(aiDecisionLog, ({ one }) => ({
  question: one(dynamicQuestions, {
    fields: [aiDecisionLog.questionId],
    references: [dynamicQuestions.id],
  }),
}));

// ── Type exports ──────────────────────────────────────────────────────────────

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
export type FeedbackAnswer = typeof feedbackAnswers.$inferSelect;
export type NewFeedbackAnswer = typeof feedbackAnswers.$inferInsert;
export type DynamicQuestion = typeof dynamicQuestions.$inferSelect;
export type NewDynamicQuestion = typeof dynamicQuestions.$inferInsert;
export type AIDecisionLog = typeof aiDecisionLog.$inferSelect;
export type NewAIDecisionLog = typeof aiDecisionLog.$inferInsert;
export type CancellationFeedback = typeof cancellationFeedback.$inferSelect;
export type NewCancellationFeedback = typeof cancellationFeedback.$inferInsert;
