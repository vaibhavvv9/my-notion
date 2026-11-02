import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import type { z } from "zod";
import { getDb } from "@/db";
import { checklistItems, notes, questions, resources, topics, type QuestionStatus } from "@/db/schema";
import type * as v from "@/lib/validation";
import { notFound } from "./http";
import { logActivity, topicExists, touchTopic } from "./service";

const newId = () => crypto.randomUUID();

/* ----------------------------------------------------------------- notes */

export async function listNotes(opts: { q?: string; pinned?: boolean; trackId?: string }) {
  const db = await getDb();
  const where = [];
  if (opts.pinned) where.push(eq(notes.pinned, true));
  if (opts.trackId) where.push(eq(topics.trackId, opts.trackId));
  if (opts.q) {
    const p = `%${opts.q.toLowerCase()}%`;
    where.push(or(like(sql`lower(${notes.title})`, p), like(sql`lower(${notes.content})`, p)));
  }
  return db
    .select({
      id: notes.id,
      title: notes.title,
      content: notes.content,
      pinned: notes.pinned,
      topicId: notes.topicId,
      updatedAt: notes.updatedAt,
      createdAt: notes.createdAt,
      topicTitle: topics.title,
      topicIcon: topics.icon,
      trackId: topics.trackId,
    })
    .from(notes)
    .innerJoin(topics, eq(topics.id, notes.topicId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(notes.pinned), desc(notes.updatedAt));
}

export async function createNote(input: z.infer<typeof v.noteCreate>) {
  const db = await getDb();
  const topic = await topicExists(db, input.topicId);
  const now = Date.now();
  const row = { id: newId(), ...input, createdAt: now, updatedAt: now };
  await db.insert(notes).values(row);
  await touchTopic(db, input.topicId);
  await logActivity(db, { topicId: topic.id, trackId: topic.trackId, kind: "note_created", detail: row.title });
  return row;
}

export async function updateNote(id: string, input: z.infer<typeof v.noteUpdate>) {
  const db = await getDb();
  const [row] = await db.update(notes).set({ ...input, updatedAt: Date.now() }).where(eq(notes.id, id)).returning();
  if (!row) throw notFound("Note");
  if (input.content !== undefined || input.title !== undefined) await touchTopic(db, row.topicId);
  return row;
}

export async function deleteNote(id: string) {
  const db = await getDb();
  const [row] = await db.delete(notes).where(eq(notes.id, id)).returning({ id: notes.id });
  if (!row) throw notFound("Note");
  return { ok: true };
}

/* ------------------------------------------------------------- questions */

export async function listQuestions(opts: {
  trackId?: string;
  topicId?: string;
  status?: string;
  difficulty?: string;
  q?: string;
}) {
  const db = await getDb();
  const where = [];
  if (opts.trackId) where.push(eq(topics.trackId, opts.trackId));
  if (opts.topicId) where.push(eq(questions.topicId, opts.topicId));
  if (opts.status) where.push(eq(questions.status, opts.status as QuestionStatus));
  if (opts.difficulty) where.push(eq(questions.difficulty, opts.difficulty as "beginner"));
  if (opts.q) {
    const p = `%${opts.q.toLowerCase()}%`;
    where.push(or(like(sql`lower(${questions.question})`, p), like(sql`lower(${questions.answer})`, p)));
  }
  return db
    .select({
      id: questions.id,
      question: questions.question,
      answer: questions.answer,
      followUps: questions.followUps,
      difficulty: questions.difficulty,
      status: questions.status,
      practiceCount: questions.practiceCount,
      lastPracticedAt: questions.lastPracticedAt,
      topicId: questions.topicId,
      topicTitle: topics.title,
      topicIcon: topics.icon,
      trackId: topics.trackId,
    })
    .from(questions)
    .innerJoin(topics, eq(topics.id, questions.topicId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(topics.trackId), asc(topics.position), asc(questions.position));
}

export async function createQuestion(input: z.infer<typeof v.questionCreate>) {
  const db = await getDb();
  const topic = await topicExists(db, input.topicId);
  const now = Date.now();
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${questions.position}), -1)` })
    .from(questions)
    .where(eq(questions.topicId, input.topicId));
  const row = { id: newId(), ...input, status: "new" as const, position: Number(max) + 1, createdAt: now, updatedAt: now };
  await db.insert(questions).values(row);
  await touchTopic(db, input.topicId);
  await logActivity(db, { topicId: topic.id, trackId: topic.trackId, kind: "question_created", detail: row.question });
  return row;
}

export async function updateQuestion(id: string, input: z.infer<typeof v.questionUpdate>) {
  const db = await getDb();
  const [row] = await db.update(questions).set({ ...input, updatedAt: Date.now() }).where(eq(questions.id, id)).returning();
  if (!row) throw notFound("Question");
  return row;
}

export async function practiceQuestion(id: string, result: "again" | "good" | "easy") {
  const db = await getDb();
  const [current] = await db.select().from(questions).where(eq(questions.id, id));
  if (!current) throw notFound("Question");
  const status: QuestionStatus =
    result === "again" ? "learning" : result === "easy" ? "mastered" : current.status === "new" ? "learning" : "mastered";
  const now = Date.now();
  const [row] = await db
    .update(questions)
    .set({ status, practiceCount: current.practiceCount + 1, lastPracticedAt: now, updatedAt: now })
    .where(eq(questions.id, id))
    .returning();
  const topic = await topicExists(db, current.topicId);
  await touchTopic(db, current.topicId);
  await logActivity(db, { topicId: topic.id, trackId: topic.trackId, kind: "practiced", detail: current.question });
  return row;
}

export async function deleteQuestion(id: string) {
  const db = await getDb();
  const [row] = await db.delete(questions).where(eq(questions.id, id)).returning({ id: questions.id });
  if (!row) throw notFound("Question");
  return { ok: true };
}

export async function reorderQuestions(ids: string[]) {
  const db = await getDb();
  await db.batch(ids.map((id, position) => db.update(questions).set({ position }).where(eq(questions.id, id))) as never);
  return { ok: true };
}

/* ------------------------------------------------------------- checklist */

export async function createChecklistItem(input: z.infer<typeof v.checklistCreate>) {
  const db = await getDb();
  await topicExists(db, input.topicId);
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${checklistItems.position}), -1)` })
    .from(checklistItems)
    .where(eq(checklistItems.topicId, input.topicId));
  const row = { id: newId(), ...input, done: false, position: Number(max) + 1, createdAt: Date.now() };
  await db.insert(checklistItems).values(row);
  return row;
}

export async function updateChecklistItem(id: string, input: z.infer<typeof v.checklistUpdate>) {
  const db = await getDb();
  const [row] = await db.update(checklistItems).set(input).where(eq(checklistItems.id, id)).returning();
  if (!row) throw notFound("Checklist item");
  if (input.done !== undefined) {
    const topic = await topicExists(db, row.topicId);
    await touchTopic(db, row.topicId);
    if (input.done) await logActivity(db, { topicId: topic.id, trackId: topic.trackId, kind: "checklist_done", detail: row.text });
  }
  return row;
}

export async function deleteChecklistItem(id: string) {
  const db = await getDb();
  const [row] = await db.delete(checklistItems).where(eq(checklistItems.id, id)).returning({ id: checklistItems.id });
  if (!row) throw notFound("Checklist item");
  return { ok: true };
}

/* ------------------------------------------------------------- resources */

export async function createResource(input: z.infer<typeof v.resourceCreate>) {
  const db = await getDb();
  await topicExists(db, input.topicId);
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${resources.position}), -1)` })
    .from(resources)
    .where(eq(resources.topicId, input.topicId));
  const row = { id: newId(), ...input, position: Number(max) + 1, createdAt: Date.now() };
  await db.insert(resources).values(row);
  return row;
}

export async function updateResource(id: string, input: z.infer<typeof v.resourceUpdate>) {
  const db = await getDb();
  const [row] = await db.update(resources).set(input).where(eq(resources.id, id)).returning();
  if (!row) throw notFound("Resource");
  return row;
}

export async function deleteResource(id: string) {
  const db = await getDb();
  const [row] = await db.delete(resources).where(eq(resources.id, id)).returning({ id: resources.id });
  if (!row) throw notFound("Resource");
  return { ok: true };
}

