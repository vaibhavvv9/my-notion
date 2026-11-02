import { and, asc, desc, eq, inArray, isNotNull, lte, sql, gte, or, like } from "drizzle-orm";
import type { z } from "zod";
import { getDb, type DB } from "@/db";
import {
  activity,
  checklistItems,
  notes,
  questions,
  resources,
  topics,
  tracks,
  type Status,
  type Topic,
} from "@/db/schema";
import type * as v from "@/lib/validation";
import { notFound, HttpError } from "./http";

const DAY = 86_400_000;
const newId = () => crypto.randomUUID();

export async function logActivity(
  db: DB,
  entry: { topicId?: string | null; trackId?: string | null; kind: string; detail?: string },
) {
  await db.insert(activity).values({
    id: newId(),
    topicId: entry.topicId ?? null,
    trackId: entry.trackId ?? null,
    kind: entry.kind,
    detail: entry.detail ?? "",
    createdAt: Date.now(),
  });
}

/* ------------------------------------------------------------------ tracks */

export async function listTree() {
  const db = await getDb();
  const [trackRows, topicRows] = await Promise.all([
    db.select().from(tracks).orderBy(asc(tracks.position), asc(tracks.createdAt)),
    db
      .select({
        id: topics.id,
        trackId: topics.trackId,
        parentId: topics.parentId,
        title: topics.title,
        icon: topics.icon,
        status: topics.status,
        difficulty: topics.difficulty,
        position: topics.position,
        pinned: topics.pinned,
      })
      .from(topics)
      .orderBy(asc(topics.position), asc(topics.createdAt)),
  ]);
  return { tracks: trackRows, topics: topicRows };
}

export async function createTrack(input: z.infer<typeof v.trackCreate>) {
  const db = await getDb();
  const now = Date.now();
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${tracks.position}), -1)` }).from(tracks);
  const row = { id: newId(), ...input, position: Number(max) + 1, createdAt: now, updatedAt: now };
  await db.insert(tracks).values(row);
  await logActivity(db, { trackId: row.id, kind: "track_created", detail: row.name });
  return row;
}

export async function updateTrack(id: string, input: z.infer<typeof v.trackUpdate>) {
  const db = await getDb();
  const res = await db
    .update(tracks)
    .set({ ...input, updatedAt: Date.now() })
    .where(eq(tracks.id, id))
    .returning();
  if (!res[0]) throw notFound("Track");
  return res[0];
}

export async function deleteTrack(id: string) {
  const db = await getDb();
  const ids = (await db.select({ id: topics.id }).from(topics).where(eq(topics.trackId, id))).map((r) => r.id);
  await deleteTopicRows(db, ids);
  const res = await db.delete(tracks).where(eq(tracks.id, id)).returning({ id: tracks.id });
  if (!res[0]) throw notFound("Track");
  await db.delete(activity).where(eq(activity.trackId, id));
  return { ok: true };
}

export async function reorderTracks(ids: string[]) {
  const db = await getDb();
  await db.batch(
    ids.map((id, position) => db.update(tracks).set({ position }).where(eq(tracks.id, id))) as never,
  );
  return { ok: true };
}

/* ------------------------------------------------------------------ topics */

async function deleteTopicRows(db: DB, ids: string[]) {
  if (!ids.length) return;
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    await db.batch([
      db.delete(notes).where(inArray(notes.topicId, chunk)),
      db.delete(questions).where(inArray(questions.topicId, chunk)),
      db.delete(checklistItems).where(inArray(checklistItems.topicId, chunk)),
      db.delete(resources).where(inArray(resources.topicId, chunk)),
      db.update(activity).set({ topicId: null }).where(inArray(activity.topicId, chunk)),
      db.delete(topics).where(inArray(topics.id, chunk)),
    ]);
  }
}

async function descendantIds(db: DB, rootId: string): Promise<string[]> {
  const all = await db.select({ id: topics.id, parentId: topics.parentId }).from(topics);
  const children = new Map<string, string[]>();
  for (const t of all) {
    if (!t.parentId) continue;
    const list = children.get(t.parentId) ?? [];
    list.push(t.id);
    children.set(t.parentId, list);
  }
  const out: string[] = [];
  const stack = [...(children.get(rootId) ?? [])];
  while (stack.length) {
    const id = stack.pop()!;
    out.push(id);
    stack.push(...(children.get(id) ?? []));
  }
  return out;
}

async function requireTopic(db: DB, id: string) {
  const [row] = await db.select().from(topics).where(eq(topics.id, id));
  if (!row) throw notFound("Topic");
  return row;
}

async function nextPosition(db: DB, trackId: string, parentId: string | null) {
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${topics.position}), -1)` })
    .from(topics)
    .where(
      and(eq(topics.trackId, trackId), parentId ? eq(topics.parentId, parentId) : sql`${topics.parentId} is null`),
    );
  return Number(max) + 1;
}

export async function createTopic(input: z.infer<typeof v.topicCreate>) {
  const db = await getDb();
  const [track] = await db.select({ id: tracks.id }).from(tracks).where(eq(tracks.id, input.trackId));
  if (!track) throw notFound("Track");
  const parentId = input.parentId ?? null;
  if (parentId) {
    const parent = await requireTopic(db, parentId);
    if (parent.trackId !== input.trackId) throw new HttpError(400, "Parent topic belongs to another track");
  }
  const now = Date.now();
  const row = {
    id: newId(),
    ...input,
    parentId,
    sections: {},
    position: await nextPosition(db, input.trackId, parentId),
    lastStudiedAt: input.status !== "not_started" ? now : null,
    completedAt: input.status === "completed" ? now : null,
    nextReviewAt: input.status === "completed" ? now + 3 * DAY : null,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(topics).values(row);
  await logActivity(db, { topicId: row.id, trackId: row.trackId, kind: "topic_created", detail: row.title });
  return row;
}

export async function getTopic(id: string) {
  const db = await getDb();
  const topic = await requireTopic(db, id);
  const [track] = await db.select().from(tracks).where(eq(tracks.id, topic.trackId));

  // Breadcrumb chain
  const ancestors: { id: string; title: string; icon: string }[] = [];
  let parentId = topic.parentId;
  for (let guard = 0; parentId && guard < 20; guard++) {
    const [p] = await db
      .select({ id: topics.id, title: topics.title, icon: topics.icon, parentId: topics.parentId })
      .from(topics)
      .where(eq(topics.id, parentId));
    if (!p) break;
    ancestors.unshift({ id: p.id, title: p.title, icon: p.icon });
    parentId = p.parentId;
  }

  const [children, noteRows, questionRows, checklistRows, resourceRows] = await Promise.all([
    db
      .select({
        id: topics.id,
        title: topics.title,
        icon: topics.icon,
        status: topics.status,
        difficulty: topics.difficulty,
        summary: topics.summary,
      })
      .from(topics)
      .where(eq(topics.parentId, id))
      .orderBy(asc(topics.position)),
    db.select().from(notes).where(eq(notes.topicId, id)).orderBy(desc(notes.pinned), desc(notes.updatedAt)),
    db.select().from(questions).where(eq(questions.topicId, id)).orderBy(asc(questions.position), asc(questions.createdAt)),
    db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.topicId, id))
      .orderBy(asc(checklistItems.position), asc(checklistItems.createdAt)),
    db.select().from(resources).where(eq(resources.topicId, id)).orderBy(asc(resources.position), asc(resources.createdAt)),
  ]);

  return {
    topic,
    track,
    ancestors,
    children,
    notes: noteRows,
    questions: questionRows,
    checklist: checklistRows,
    resources: resourceRows,
  };
}

export async function visitTopic(id: string) {
  const db = await getDb();
  const res = await db
    .update(topics)
    .set({ lastViewedAt: Date.now() })
    .where(eq(topics.id, id))
    .returning({ id: topics.id });
  if (!res[0]) throw notFound("Topic");
  return { ok: true };
}

export async function updateTopic(id: string, input: z.infer<typeof v.topicUpdate>) {
  const db = await getDb();
  const current = await requireTopic(db, id);
  const now = Date.now();
  const patch: Partial<Topic> = { updatedAt: now };

  for (const key of ["title", "icon", "summary", "difficulty", "tags", "pinned", "confidence", "nextReviewAt"] as const) {
    if (input[key] !== undefined) (patch as Record<string, unknown>)[key] = input[key];
  }

  if (input.sections) {
    patch.sections = { ...current.sections, ...input.sections };
    patch.lastStudiedAt = now;
  }

  if (input.status && input.status !== current.status) {
    patch.status = input.status;
    applyStatusTransition(patch, input.status, current, now);
    await logActivity(db, {
      topicId: id,
      trackId: current.trackId,
      kind: `status_${input.status}`,
      detail: current.title,
    });
  }

  // Moving across parents / tracks
  const moving =
    (input.trackId !== undefined && input.trackId !== current.trackId) ||
    (input.parentId !== undefined && (input.parentId ?? null) !== current.parentId);
  if (moving) {
    const trackId = input.trackId ?? current.trackId;
    const parentId = input.parentId !== undefined ? input.parentId : current.parentId;
    const [track] = await db.select({ id: tracks.id }).from(tracks).where(eq(tracks.id, trackId));
    if (!track) throw notFound("Track");
    const descendants = await descendantIds(db, id);
    if (parentId) {
      if (parentId === id || descendants.includes(parentId))
        throw new HttpError(400, "A topic can't be moved inside itself");
      const parent = await requireTopic(db, parentId);
      if (parent.trackId !== trackId) throw new HttpError(400, "Parent topic belongs to another track");
    }
    patch.trackId = trackId;
    patch.parentId = parentId ?? null;
    patch.position = await nextPosition(db, trackId, parentId ?? null);
    if (trackId !== current.trackId && descendants.length) {
      await db.update(topics).set({ trackId }).where(inArray(topics.id, descendants));
    }
  }

  const [row] = await db.update(topics).set(patch).where(eq(topics.id, id)).returning();
  return row;
}

function applyStatusTransition(patch: Partial<Topic>, status: Status, current: Topic, now: number) {
  if (status === "completed") {
    patch.completedAt = now;
    patch.lastStudiedAt = now;
    if (!current.nextReviewAt || current.nextReviewAt < now) patch.nextReviewAt = now + 3 * DAY;
  } else if (status === "in_progress") {
    patch.completedAt = null;
    patch.lastStudiedAt = now;
  } else {
    patch.completedAt = null;
    patch.nextReviewAt = null;
  }
}

export async function deleteTopic(id: string) {
  const db = await getDb();
  const topic = await requireTopic(db, id);
  const ids = [id, ...(await descendantIds(db, id))];
  await deleteTopicRows(db, ids);
  await logActivity(db, { trackId: topic.trackId, kind: "topic_deleted", detail: topic.title });
  return { ok: true, deleted: ids.length };
}

export async function reorderTopics(ids: string[]) {
  const db = await getDb();
  await db.batch(ids.map((id, position) => db.update(topics).set({ position }).where(eq(topics.id, id))) as never);
  return { ok: true };
}

/** Spaced-repetition style revision: confidence 1–5 schedules the next review. */
export async function reviewTopic(id: string, confidence: number) {
  const db = await getDb();
  const current = await requireTopic(db, id);
  const now = Date.now();
  const base = [1, 2, 4, 7, 14][confidence - 1];
  const multiplier = confidence >= 3 ? Math.min(2 ** current.reviewCount, 4) : 1;
  const [row] = await db
    .update(topics)
    .set({
      confidence,
      reviewCount: current.reviewCount + 1,
      lastStudiedAt: now,
      nextReviewAt: now + base * multiplier * DAY,
      status: current.status === "not_started" ? "in_progress" : current.status,
      updatedAt: now,
    })
    .where(eq(topics.id, id))
    .returning();
  await logActivity(db, {
    topicId: id,
    trackId: current.trackId,
    kind: "reviewed",
    detail: `${current.title} (confidence ${confidence}/5)`,
  });
  return row;
}

export type TopicFilters = {
  q?: string;
  trackId?: string;
  status?: string;
  difficulty?: string;
  tag?: string;
  pinned?: boolean;
  sort?: string;
};

export async function listTopics(f: TopicFilters) {
  const db = await getDb();
  const where = [];
  if (f.trackId) where.push(eq(topics.trackId, f.trackId));
  if (f.status) where.push(eq(topics.status, f.status as Status));
  if (f.difficulty) where.push(eq(topics.difficulty, f.difficulty as Topic["difficulty"]));
  if (f.pinned) where.push(eq(topics.pinned, true));
  if (f.tag) where.push(sql`exists (select 1 from json_each(${topics.tags}) where value = ${f.tag.toLowerCase()})`);
  if (f.q) {
    const pattern = `%${f.q.toLowerCase()}%`;
    where.push(or(like(sql`lower(${topics.title})`, pattern), like(sql`lower(${topics.summary})`, pattern), like(sql`lower(${topics.tags})`, pattern)));
  }
  const order =
    f.sort === "updated"
      ? [desc(topics.updatedAt)]
      : f.sort === "title"
        ? [asc(topics.title)]
        : f.sort === "difficulty"
          ? [sql`case ${topics.difficulty} when 'beginner' then 0 when 'intermediate' then 1 else 2 end`, asc(topics.title)]
          : [asc(topics.trackId), asc(topics.position)];

  const rows = await db
    .select({
      id: topics.id,
      trackId: topics.trackId,
      parentId: topics.parentId,
      title: topics.title,
      icon: topics.icon,
      summary: topics.summary,
      status: topics.status,
      difficulty: topics.difficulty,
      tags: topics.tags,
      pinned: topics.pinned,
      confidence: topics.confidence,
      nextReviewAt: topics.nextReviewAt,
      updatedAt: topics.updatedAt,
      position: topics.position,
      questionCount: sql<number>`(select count(*) from questions q where q.topic_id = topics.id)`,
      noteCount: sql<number>`(select count(*) from notes n where n.topic_id = topics.id)`,
    })
    .from(topics)
    .where(where.length ? and(...where) : undefined)
    .orderBy(...order);
  return rows;
}

export async function listTags() {
  const db = await getDb();
  const rows = await db.all<{ tag: string; count: number }>(
    sql`select value as tag, count(*) as count from topics, json_each(topics.tags) group by value order by count desc, value asc`,
  );
  return rows.map((r) => ({ tag: String(r.tag), count: Number(r.count) }));
}

/* ------------------------------------------------------------- dashboard */

export async function getDashboard(tzOffsetMinutes = 0) {
  const db = await getDb();
  const now = Date.now();

  const [trackRows, counts, qStats] = await Promise.all([
    db.select().from(tracks).orderBy(asc(tracks.position)),
    db
      .select({ trackId: topics.trackId, status: topics.status, n: sql<number>`count(*)` })
      .from(topics)
      .groupBy(topics.trackId, topics.status),
    db.select({ status: questions.status, n: sql<number>`count(*)` }).from(questions).groupBy(questions.status),
  ]);

  const byTrack = trackRows.map((t) => {
    const c = { not_started: 0, in_progress: 0, completed: 0 } as Record<Status, number>;
    counts.filter((r) => r.trackId === t.id).forEach((r) => (c[r.status] = Number(r.n)));
    const total = c.not_started + c.in_progress + c.completed;
    return {
      id: t.id,
      name: t.name,
      icon: t.icon,
      total,
      completed: c.completed,
      inProgress: c.in_progress,
      notStarted: c.not_started,
      percent: total ? Math.round((c.completed / total) * 100) : 0,
    };
  });
  const sum = (k: "total" | "completed" | "inProgress" | "notStarted") => byTrack.reduce((a, t) => a + t[k], 0);
  const overall = {
    total: sum("total"),
    completed: sum("completed"),
    inProgress: sum("inProgress"),
    notStarted: sum("notStarted"),
    percent: sum("total") ? Math.round((sum("completed") / sum("total")) * 100) : 0,
  };

  const light = {
    id: topics.id,
    trackId: topics.trackId,
    title: topics.title,
    icon: topics.icon,
    status: topics.status,
    difficulty: topics.difficulty,
    summary: topics.summary,
    confidence: topics.confidence,
    nextReviewAt: topics.nextReviewAt,
    lastViewedAt: topics.lastViewedAt,
    lastStudiedAt: topics.lastStudiedAt,
  };

  const [continueLearning, recent, dueReviews, weak, pinnedTopics, pinnedNotes, upNext] = await Promise.all([
    db
      .select(light)
      .from(topics)
      .where(eq(topics.status, "in_progress"))
      .orderBy(desc(sql`coalesce(${topics.lastViewedAt}, ${topics.lastStudiedAt}, ${topics.updatedAt})`))
      .limit(5),
    db
      .select(light)
      .from(topics)
      .where(or(isNotNull(topics.lastViewedAt), isNotNull(topics.lastStudiedAt)))
      .orderBy(desc(sql`max(coalesce(${topics.lastViewedAt}, 0), coalesce(${topics.lastStudiedAt}, 0))`))
      .limit(6),
    db
      .select(light)
      .from(topics)
      .where(and(isNotNull(topics.nextReviewAt), lte(topics.nextReviewAt, now + 3 * DAY)))
      .orderBy(asc(topics.nextReviewAt))
      .limit(8),
    db
      .select(light)
      .from(topics)
      .where(and(isNotNull(topics.confidence), lte(topics.confidence, 2)))
      .orderBy(asc(topics.confidence), desc(topics.updatedAt))
      .limit(5),
    db.select(light).from(topics).where(eq(topics.pinned, true)).orderBy(desc(topics.updatedAt)).limit(8),
    db
      .select({ id: notes.id, title: notes.title, topicId: notes.topicId, updatedAt: notes.updatedAt, topicTitle: topics.title })
      .from(notes)
      .innerJoin(topics, eq(topics.id, notes.topicId))
      .where(eq(notes.pinned, true))
      .orderBy(desc(notes.updatedAt))
      .limit(8),
    // First not-started top-level topic in each track: a sensible "start here"
    db
      .select(light)
      .from(topics)
      .where(
        and(
          eq(topics.status, "not_started"),
          sql`${topics.parentId} is null`,
          sql`${topics.position} = (select min(t2.position) from topics t2 where t2.track_id = topics.track_id and t2.parent_id is null and t2.status = 'not_started')`,
        ),
      ),
  ]);

  // Activity heatmap: last 18 weeks bucketed by local day
  const since = now - 18 * 7 * DAY;
  const offsetMs = tzOffsetMinutes * 60_000;
  const activityRows = await db
    .select({
      day: sql<number>`cast((${activity.createdAt} - ${offsetMs}) / ${DAY} as integer)`,
      n: sql<number>`count(*)`,
    })
    .from(activity)
    .where(gte(activity.createdAt, since))
    .groupBy(sql`1`);
  const heat: Record<string, number> = {};
  for (const r of activityRows) heat[String(r.day)] = Number(r.n);

  // Streak of consecutive local days with activity, ending today or yesterday
  const today = Math.floor((now - offsetMs) / DAY);
  let streak = 0;
  for (let d = heat[today] ? today : today - 1; heat[d]; d--) streak++;

  const recentActivity = await db
    .select()
    .from(activity)
    .orderBy(desc(activity.createdAt))
    .limit(8);

  const q = { new: 0, learning: 0, mastered: 0 } as Record<string, number>;
  qStats.forEach((r) => (q[r.status] = Number(r.n)));

  return {
    overall,
    tracks: byTrack,
    continueLearning,
    recent,
    dueReviews,
    weak,
    pinnedTopics,
    pinnedNotes,
    upNext,
    heatmap: { today, days: heat },
    streak,
    recentActivity,
    questions: { total: q.new + q.learning + q.mastered, ...q },
  };
}

/* ---------------------------------------------------------------- search */

function snippet(text: string, q: string, len = 140) {
  const plain = text.replace(/```[\s\S]*?```/g, " ").replace(/[#*_`>\[\]]/g, "").replace(/\s+/g, " ");
  const i = plain.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return plain.slice(0, len);
  const start = Math.max(0, i - 50);
  return (start > 0 ? "…" : "") + plain.slice(start, start + len) + (start + len < plain.length ? "…" : "");
}

export async function search(q: string) {
  const db = await getDb();
  const term = q.trim();
  if (!term) return { topics: [], notes: [], questions: [] };
  const pattern = `%${term.toLowerCase()}%`;
  const [topicRows, noteRows, questionRows] = await Promise.all([
    db
      .select({
        id: topics.id,
        title: topics.title,
        icon: topics.icon,
        summary: topics.summary,
        sections: topics.sections,
        status: topics.status,
        trackId: topics.trackId,
        rank: sql<number>`case when lower(${topics.title}) like ${pattern} then 0 when lower(${topics.tags}) like ${pattern} then 1 else 2 end`,
      })
      .from(topics)
      .where(
        or(
          like(sql`lower(${topics.title})`, pattern),
          like(sql`lower(${topics.summary})`, pattern),
          like(sql`lower(${topics.tags})`, pattern),
          like(sql`lower(${topics.sections})`, pattern),
        ),
      )
      .orderBy(sql`8`, asc(topics.title))
      .limit(12),
    db
      .select({ id: notes.id, title: notes.title, content: notes.content, topicId: notes.topicId, topicTitle: topics.title })
      .from(notes)
      .innerJoin(topics, eq(topics.id, notes.topicId))
      .where(or(like(sql`lower(${notes.title})`, pattern), like(sql`lower(${notes.content})`, pattern)))
      .orderBy(desc(notes.updatedAt))
      .limit(10),
    db
      .select({
        id: questions.id,
        question: questions.question,
        answer: questions.answer,
        topicId: questions.topicId,
        topicTitle: topics.title,
      })
      .from(questions)
      .innerJoin(topics, eq(topics.id, questions.topicId))
      .where(or(like(sql`lower(${questions.question})`, pattern), like(sql`lower(${questions.answer})`, pattern)))
      .limit(10),
  ]);

  return {
    topics: topicRows.map(({ sections, rank: _rank, ...t }) => {
      const hay = [t.summary, ...Object.values(sections ?? {})].join("\n");
      return { ...t, snippet: t.title.toLowerCase().includes(term.toLowerCase()) ? t.summary : snippet(hay, term) };
    }),
    notes: noteRows.map(({ content, ...n }) => ({ ...n, snippet: snippet(content, term) })),
    questions: questionRows.map(({ answer, ...qq }) => ({ ...qq, snippet: snippet(answer, term) })),
  };
}

/* ------------------------------------------------------------- children */

export async function touchTopic(db: DB, topicId: string) {
  await db.update(topics).set({ lastStudiedAt: Date.now(), updatedAt: Date.now() }).where(eq(topics.id, topicId));
}

export async function topicExists(db: DB, topicId: string) {
  const [t] = await db.select({ id: topics.id, trackId: topics.trackId, title: topics.title }).from(topics).where(eq(topics.id, topicId));
  if (!t) throw notFound("Topic");
  return t;
}
