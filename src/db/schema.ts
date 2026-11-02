import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

import { DIFFICULTIES, QUESTION_STATUSES, RESOURCE_KINDS, STATUSES, type Sections } from "@/lib/constants";

export * from "@/lib/constants";

export const tracks = sqliteTable("tracks", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  icon: text("icon").notNull().default("📘"),
  position: integer("position").notNull().default(0),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const topics = sqliteTable(
  "topics",
  {
    id: text("id").primaryKey(),
    trackId: text("track_id").notNull(),
    parentId: text("parent_id"),
    title: text("title").notNull(),
    icon: text("icon").notNull().default(""),
    summary: text("summary").notNull().default(""),
    status: text("status", { enum: STATUSES }).notNull().default("not_started"),
    difficulty: text("difficulty", { enum: DIFFICULTIES }).notNull().default("intermediate"),
    tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
    sections: text("sections", { mode: "json" }).$type<Sections>().notNull().default({}),
    position: integer("position").notNull().default(0),
    pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
    confidence: integer("confidence"),
    reviewCount: integer("review_count").notNull().default(0),
    lastStudiedAt: integer("last_studied_at"),
    lastViewedAt: integer("last_viewed_at"),
    nextReviewAt: integer("next_review_at"),
    completedAt: integer("completed_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [index("topics_track_idx").on(t.trackId), index("topics_parent_idx").on(t.parentId)],
);

export const notes = sqliteTable(
  "notes",
  {
    id: text("id").primaryKey(),
    topicId: text("topic_id").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull().default(""),
    pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [index("notes_topic_idx").on(t.topicId)],
);

export const questions = sqliteTable(
  "questions",
  {
    id: text("id").primaryKey(),
    topicId: text("topic_id").notNull(),
    question: text("question").notNull(),
    answer: text("answer").notNull().default(""),
    followUps: text("follow_ups").notNull().default(""),
    difficulty: text("difficulty", { enum: DIFFICULTIES }).notNull().default("intermediate"),
    status: text("status", { enum: QUESTION_STATUSES }).notNull().default("new"),
    position: integer("position").notNull().default(0),
    practiceCount: integer("practice_count").notNull().default(0),
    lastPracticedAt: integer("last_practiced_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [index("questions_topic_idx").on(t.topicId)],
);

export const checklistItems = sqliteTable(
  "checklist_items",
  {
    id: text("id").primaryKey(),
    topicId: text("topic_id").notNull(),
    text: text("text").notNull(),
    done: integer("done", { mode: "boolean" }).notNull().default(false),
    position: integer("position").notNull().default(0),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("checklist_topic_idx").on(t.topicId)],
);

export const resources = sqliteTable(
  "resources",
  {
    id: text("id").primaryKey(),
    topicId: text("topic_id").notNull(),
    title: text("title").notNull(),
    url: text("url").notNull(),
    kind: text("kind", { enum: RESOURCE_KINDS }).notNull().default("article"),
    position: integer("position").notNull().default(0),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("resources_topic_idx").on(t.topicId)],
);

export const activity = sqliteTable(
  "activity",
  {
    id: text("id").primaryKey(),
    topicId: text("topic_id"),
    trackId: text("track_id"),
    kind: text("kind").notNull(),
    detail: text("detail").notNull().default(""),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("activity_created_idx").on(t.createdAt)],
);

export type Track = typeof tracks.$inferSelect;
export type Topic = typeof topics.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type ChecklistItem = typeof checklistItems.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type Activity = typeof activity.$inferSelect;
