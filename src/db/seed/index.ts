import type { DB } from "../index";
import { checklistItems, questions, resources, topics, tracks } from "../schema";
import data from "./data.json";
import type { SeedTopic, SeedTrack } from "./types";

const id = () => crypto.randomUUID();

/** Inserts the bundled starter curriculum. Called once on a fresh database. */
export async function seedDatabase(db: DB) {
  const now = Date.now();
  const trackRows: (typeof tracks.$inferInsert)[] = [];
  const topicRows: (typeof topics.$inferInsert)[] = [];
  const questionRows: (typeof questions.$inferInsert)[] = [];
  const checklistRows: (typeof checklistItems.$inferInsert)[] = [];
  const resourceRows: (typeof resources.$inferInsert)[] = [];

  const addTopics = (list: SeedTopic[], trackId: string, parentId: string | null) => {
    list.forEach((t, position) => {
      const topicId = id();
      topicRows.push({
        id: topicId,
        trackId,
        parentId,
        title: t.title,
        icon: t.icon,
        summary: t.summary,
        difficulty: t.difficulty,
        tags: t.tags,
        sections: t.sections,
        position,
        createdAt: now,
        updatedAt: now,
      });
      t.questions.forEach((q, i) =>
        questionRows.push({ id: id(), topicId, ...q, position: i, createdAt: now, updatedAt: now }),
      );
      t.checklist.forEach((text, i) =>
        checklistRows.push({ id: id(), topicId, text, position: i, createdAt: now }),
      );
      t.resources.forEach((r, i) =>
        resourceRows.push({ id: id(), topicId, ...r, position: i, createdAt: now }),
      );
      addTopics(t.children, trackId, topicId);
    });
  };

  (data as SeedTrack[]).forEach((t, position) => {
    const trackId = id();
    trackRows.push({
      id: trackId,
      name: t.name,
      icon: t.icon,
      description: t.description,
      position,
      createdAt: now,
      updatedAt: now,
    });
    addTopics(t.topics, trackId, null);
  });

  const chunks = <T,>(rows: T[], size = 50) =>
    Array.from({ length: Math.ceil(rows.length / size) }, (_, i) => rows.slice(i * size, i * size + size));

  if (trackRows.length) await db.insert(tracks).values(trackRows);
  for (const c of chunks(topicRows)) await db.insert(topics).values(c);
  for (const c of chunks(questionRows)) await db.insert(questions).values(c);
  for (const c of chunks(checklistRows)) await db.insert(checklistItems).values(c);
  for (const c of chunks(resourceRows)) await db.insert(resources).values(c);
}
