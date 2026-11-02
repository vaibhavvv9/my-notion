import { z } from "zod";
import { getDb } from "@/db";
import { activity, checklistItems, notes, questions, resources, topics, tracks } from "@/db/schema";
import { HttpError } from "./http";

const TABLES = { tracks, topics, notes, questions, checklistItems, resources, activity } as const;
type TableName = keyof typeof TABLES;

export async function exportAll() {
  const db = await getDb();
  const out: Record<string, unknown[]> = {};
  for (const [name, table] of Object.entries(TABLES)) out[name] = await db.select().from(table);
  return { app: "interview-prep-workspace", version: 1, exportedAt: new Date().toISOString(), data: out };
}

const backupSchema = z.object({
  app: z.literal("interview-prep-workspace"),
  version: z.literal(1),
  data: z.object(
    Object.fromEntries(Object.keys(TABLES).map((k) => [k, z.array(z.record(z.string(), z.unknown()))])) as Record<
      TableName,
      z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>
    >,
  ),
});

/** Replaces all data with the contents of a backup produced by exportAll(). */
export async function importAll(input: unknown) {
  const parsed = backupSchema.safeParse(input);
  if (!parsed.success) throw new HttpError(400, "That file isn't a valid workspace backup");
  const db = await getDb();
  const { data } = parsed.data;
  const order: TableName[] = ["tracks", "topics", "notes", "questions", "checklistItems", "resources", "activity"];
  // Delete children first, then insert parents first.
  await db.batch([...order].reverse().map((name) => db.delete(TABLES[name])) as never);
  for (const name of order) {
    const rows = data[name];
    for (let i = 0; i < rows.length; i += 50) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.insert(TABLES[name]).values(rows.slice(i, i + 50) as any);
    }
  }
  return { ok: true, counts: Object.fromEntries(order.map((n) => [n, data[n].length])) };
}
