/**
 * Compiles the human-friendly seed content in src/db/seed/content/*.md into
 * src/db/seed/data.json, which the app imports on first run.
 *
 * Format (directives start a line with "@"):
 *   @track Name | icon | description
 *   @topic Title | icon | difficulty | tag1, tag2
 *   @subtopic Title | icon | difficulty | tags      (child of the last @topic)
 *   @summary One-line summary
 *   @section concept|fundamentals|advanced|examples|useCases|mistakes
 *   @q difficulty | Question text        (answer markdown follows)
 *   @followups                           (markdown list of follow-ups follows)
 *   @checklist                           ("- item" lines follow)
 *   @resources                           ("- [Title](url) kind" lines follow)
 */
import fs from "node:fs";
import path from "node:path";
import { DIFFICULTIES, RESOURCE_KINDS, SECTION_KEYS } from "../src/db/schema";
import type { SeedQuestion, SeedTopic, SeedTrack } from "../src/db/seed/types";

const dir = path.join(__dirname, "../src/db/seed/content");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();

function fail(file: string, line: number, msg: string): never {
  throw new Error(`${file}:${line + 1}: ${msg}`);
}

const tracks: SeedTrack[] = [];

for (const file of files) {
  const lines = fs.readFileSync(path.join(dir, file), "utf8").split("\n");
  let track: SeedTrack | null = null;
  let topic: SeedTopic | null = null;
  let parent: SeedTopic | null = null;
  // Where body lines currently go
  let target: { kind: "section"; key: string } | { kind: "answer" | "followups"; q: SeedQuestion } | { kind: "checklist" | "resources" } | null = null;
  let buffer: string[] = [];

  const flush = (lineNo: number) => {
    const text = buffer.join("\n").trim();
    buffer = [];
    if (!target || !topic) return;
    if (target.kind === "section") {
      (topic.sections as Record<string, string>)[target.key] = text;
    } else if (target.kind === "answer") {
      target.q.answer = text;
    } else if (target.kind === "followups") {
      target.q.followUps = text;
    } else if (target.kind === "checklist") {
      topic.checklist = text
        .split("\n")
        .map((l) => l.replace(/^\s*-\s*/, "").trim())
        .filter(Boolean);
    } else if (target.kind === "resources") {
      topic.resources = text
        .split("\n")
        .filter((l) => l.trim())
        .map((l) => {
          const m = l.match(/^\s*-\s*\[(.+?)\]\((.+?)\)\s*(\w+)?\s*$/);
          if (!m) fail(file, lineNo, `bad resource line: ${l}`);
          const kind = (m[3] || "article") as (typeof RESOURCE_KINDS)[number];
          if (!RESOURCE_KINDS.includes(kind)) fail(file, lineNo, `bad resource kind ${kind}`);
          return { title: m[1], url: m[2], kind };
        });
    }
  };

  const newTopic = (args: string[], lineNo: number): SeedTopic => {
    const [title, icon = "", difficulty = "intermediate", tags = ""] = args;
    if (!DIFFICULTIES.includes(difficulty as never)) fail(file, lineNo, `bad difficulty ${difficulty}`);
    return {
      title,
      icon,
      summary: "",
      difficulty: difficulty as SeedTopic["difficulty"],
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      sections: {},
      questions: [],
      checklist: [],
      resources: [],
      children: [],
    };
  };

  const DIRECTIVES = ["track", "topic", "subtopic", "summary", "section", "q", "followups", "checklist", "resources"];
  let inFence = false;
  lines.forEach((raw, i) => {
    if (/^\s*```/.test(raw)) inFence = !inFence;
    const m = inFence ? null : raw.match(/^@(\w+)\s*(.*)$/);
    if (!m || !DIRECTIVES.includes(m[1])) {
      if (m && !inFence) console.warn(`${file}:${i + 1}: treating unknown @${m[1]} as text`);
      buffer.push(raw);
      return;
    }
    flush(i);
    const [, directive, rest] = m;
    const args = rest.split("|").map((s) => s.trim());
    switch (directive) {
      case "track":
        track = { name: args[0], icon: args[1] || "📘", description: args[2] || "", topics: [] };
        tracks.push(track);
        topic = parent = null;
        target = null;
        break;
      case "topic":
        if (!track) fail(file, i, "@topic before @track");
        topic = parent = newTopic(args, i);
        track.topics.push(topic);
        target = null;
        break;
      case "subtopic":
        if (!parent) fail(file, i, "@subtopic before @topic");
        topic = newTopic(args, i);
        parent.children.push(topic);
        target = null;
        break;
      case "summary":
        if (!topic) fail(file, i, "@summary outside topic");
        topic.summary = rest.trim().replace(/`/g, "");
        target = null;
        break;
      case "section":
        if (!SECTION_KEYS.includes(rest.trim() as never)) fail(file, i, `bad section ${rest}`);
        target = { kind: "section", key: rest.trim() };
        break;
      case "q": {
        if (!topic) fail(file, i, "@q outside topic");
        const [difficulty, ...qs] = args;
        if (!DIFFICULTIES.includes(difficulty as never)) fail(file, i, `bad difficulty ${difficulty}`);
        const q: SeedQuestion = {
          question: qs.join(" | "),
          answer: "",
          followUps: "",
          difficulty: difficulty as SeedQuestion["difficulty"],
        };
        topic.questions.push(q);
        target = { kind: "answer", q };
        break;
      }
      case "followups":
        if (!target || (target.kind !== "answer" && target.kind !== "followups")) fail(file, i, "@followups without @q");
        target = { kind: "followups", q: target.q };
        break;
      case "checklist":
        target = { kind: "checklist" };
        break;
      case "resources":
        target = { kind: "resources" };
        break;
      default:
        fail(file, i, `unknown directive @${directive}`);
    }
  });
  flush(lines.length);
}

let topicCount = 0;
let qCount = 0;
const count = (ts: SeedTopic[]) =>
  ts.forEach((t) => {
    topicCount++;
    qCount += t.questions.length;
    count(t.children);
  });
tracks.forEach((t) => count(t.topics));

fs.writeFileSync(path.join(__dirname, "../src/db/seed/data.json"), JSON.stringify(tracks, null, 1));
console.log(`Seed built: ${tracks.length} tracks, ${topicCount} topics, ${qCount} questions`);
