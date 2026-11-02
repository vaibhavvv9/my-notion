import { z } from "zod";
import { DIFFICULTIES, QUESTION_STATUSES, RESOURCE_KINDS, SECTION_KEYS, STATUSES } from "@/db/schema";

const trimmed = (max: number) => z.string().trim().max(max);
const required = (max: number, label = "Value") => trimmed(max).min(1, `${label} is required`);

export const trackCreate = z.object({
  name: required(80, "Name"),
  description: trimmed(500).optional().default(""),
  icon: trimmed(16).optional().default("📘"),
});
export const trackUpdate = trackCreate.partial();

const tags = z
  .array(trimmed(32).toLowerCase())
  .max(20)
  .transform((t) => Array.from(new Set(t.filter(Boolean))));

const sections = z.object(
  Object.fromEntries(SECTION_KEYS.map((k) => [k, z.string().max(50_000).optional()])) as Record<
    (typeof SECTION_KEYS)[number],
    z.ZodOptional<z.ZodString>
  >,
);

export const topicCreate = z.object({
  trackId: z.string().min(1),
  parentId: z.string().min(1).nullable().optional(),
  title: required(160, "Title"),
  icon: trimmed(16).optional().default(""),
  summary: trimmed(500).optional().default(""),
  difficulty: z.enum(DIFFICULTIES).optional().default("intermediate"),
  status: z.enum(STATUSES).optional().default("not_started"),
  tags: tags.optional().default([]),
});

export const topicUpdate = z.object({
  title: required(160, "Title").optional(),
  icon: trimmed(16).optional(),
  summary: trimmed(500).optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  status: z.enum(STATUSES).optional(),
  tags: tags.optional(),
  pinned: z.boolean().optional(),
  confidence: z.number().int().min(1).max(5).nullable().optional(),
  nextReviewAt: z.number().int().nullable().optional(),
  sections: sections.partial().optional(),
  // Moving
  trackId: z.string().min(1).optional(),
  parentId: z.string().min(1).nullable().optional(),
});

export const reorder = z.object({ ids: z.array(z.string().min(1)).min(1).max(500) });

export const review = z.object({ confidence: z.number().int().min(1).max(5) });

export const noteCreate = z.object({
  topicId: z.string().min(1),
  title: required(160, "Title"),
  content: z.string().max(100_000).optional().default(""),
  pinned: z.boolean().optional().default(false),
});
export const noteUpdate = noteCreate.omit({ topicId: true }).partial();

export const questionCreate = z.object({
  topicId: z.string().min(1),
  question: required(1000, "Question"),
  answer: z.string().max(50_000).optional().default(""),
  followUps: z.string().max(10_000).optional().default(""),
  difficulty: z.enum(DIFFICULTIES).optional().default("intermediate"),
});
export const questionUpdate = questionCreate
  .omit({ topicId: true })
  .partial()
  .extend({ status: z.enum(QUESTION_STATUSES).optional() });

export const practice = z.object({ result: z.enum(["again", "good", "easy"]) });

export const checklistCreate = z.object({
  topicId: z.string().min(1),
  text: required(300, "Text"),
});
export const checklistUpdate = z.object({
  text: required(300, "Text").optional(),
  done: z.boolean().optional(),
});

export const resourceCreate = z.object({
  topicId: z.string().min(1),
  title: required(200, "Title"),
  url: z
    .string()
    .trim()
    .url("Enter a valid URL (including https://)")
    .refine((u) => /^https?:\/\//i.test(u), "Only http(s) links are allowed"),
  kind: z.enum(RESOURCE_KINDS).optional().default("article"),
});
export const resourceUpdate = resourceCreate.omit({ topicId: true }).partial();
