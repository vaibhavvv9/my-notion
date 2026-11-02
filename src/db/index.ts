import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";
import { seedDatabase } from "./seed";

export type DB = LibSQLDatabase<typeof schema>;

const DDL = [
  `CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    icon TEXT NOT NULL DEFAULT '📘',
    position INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    track_id TEXT NOT NULL,
    parent_id TEXT,
    title TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '',
    summary TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'not_started',
    difficulty TEXT NOT NULL DEFAULT 'intermediate',
    tags TEXT NOT NULL DEFAULT '[]',
    sections TEXT NOT NULL DEFAULT '{}',
    position INTEGER NOT NULL DEFAULT 0,
    pinned INTEGER NOT NULL DEFAULT 0,
    confidence INTEGER,
    review_count INTEGER NOT NULL DEFAULT 0,
    last_studied_at INTEGER,
    last_viewed_at INTEGER,
    next_review_at INTEGER,
    completed_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS topics_track_idx ON topics(track_id)`,
  `CREATE INDEX IF NOT EXISTS topics_parent_idx ON topics(parent_id)`,
  `CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    pinned INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS notes_topic_idx ON notes(topic_id)`,
  `CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL DEFAULT '',
    follow_ups TEXT NOT NULL DEFAULT '',
    difficulty TEXT NOT NULL DEFAULT 'intermediate',
    status TEXT NOT NULL DEFAULT 'new',
    position INTEGER NOT NULL DEFAULT 0,
    practice_count INTEGER NOT NULL DEFAULT 0,
    last_practiced_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS questions_topic_idx ON questions(topic_id)`,
  `CREATE TABLE IF NOT EXISTS checklist_items (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL,
    text TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS checklist_topic_idx ON checklist_items(topic_id)`,
  `CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'article',
    position INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS resources_topic_idx ON resources(topic_id)`,
  `CREATE TABLE IF NOT EXISTS activity (
    id TEXT PRIMARY KEY,
    topic_id TEXT,
    track_id TEXT,
    kind TEXT NOT NULL,
    detail TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS activity_created_idx ON activity(created_at)`,
  `CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
];

function resolveUrl(): string {
  const url = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;
  if (url) return url;
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  return `file:${path.join(dir, "prep.db")}`;
}

type Cache = { client?: Client; db?: DB; ready?: Promise<DB> };
const g = globalThis as unknown as { __prepDb?: Cache };
const cache: Cache = (g.__prepDb ??= {});

async function init(): Promise<DB> {
  const url = resolveUrl();
  const client = createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN,
  });
  if (url.startsWith("file:")) {
    await client.execute("PRAGMA journal_mode = WAL");
  }
  await client.batch(DDL, "write");
  const db = drizzle(client, { schema });
  cache.client = client;
  cache.db = db;

  // Seed exactly once. The meta flag (claimed atomically) means deleting all
  // content never re-seeds it, and concurrent cold starts never double-seed.
  if (process.env.SKIP_SEED !== "1") {
    const claim = await client.execute({
      sql: "INSERT OR IGNORE INTO meta (key, value) VALUES ('seeded', ?)",
      args: [String(Date.now())],
    });
    if (claim.rowsAffected === 1) {
      try {
        await seedDatabase(db);
      } catch (err) {
        await client.execute("DELETE FROM meta WHERE key = 'seeded'");
        throw err;
      }
    }
  }
  return db;
}

/** Returns a ready database (schema created, seeded on first run). */
export function getDb(): Promise<DB> {
  if (!cache.ready) {
    cache.ready = init().catch((err) => {
      cache.ready = undefined;
      throw err;
    });
  }
  return cache.ready;
}

export { schema };
