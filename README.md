# Interview Prep Workspace

A personal, Notion-style workspace for preparing for **Frontend**, **Full Stack** and **AI Engineering** interviews. Organise topics into learning tracks, write notes, drill interview questions, track progress, and let spaced repetition tell you what to revise next.

It ships with a starter curriculum: **3 tracks, 36 topics and subtopics, and 82 interview questions with model answers and follow-ups**. Every topic has a full study guide, a prep checklist and curated resources. Everything is editable.

## Features

- **Learning tracks and nested topics.** Create, rename, reorder (drag and drop), move and delete tracks, topics and subtopics, nested as deep as you like.
- **Structured study guide per topic**: concept explanation, fundamentals, advanced concepts, practical code examples, real-world use cases, common mistakes. Each block is a click-to-edit Markdown editor with syntax-highlighted code, a formatting toolbar and autosave.
- **Interview Q&A** per topic, with model answers, likely follow-ups, difficulty and a New / Learning / Mastered status.
- **Practice mode**: flashcard drills filtered by track, topic, difficulty or mastery. Answer aloud, reveal, rate yourself (keyboard: Space, 1, 2, 3).
- **Revision queue**: log a revision with a 1–5 confidence rating and the next review is scheduled automatically (spaced repetition). Low-confidence topics surface as weak spots.
- **Checklists, personal notes and resource links** on every topic. Notes can be pinned to the dashboard.
- **Status, difficulty and tags** on every topic, plus favourites.
- **Dashboard**: overall and per-track progress, completed/in-progress/pending counts, continue learning, up next, due for revision, weak spots, recently studied, quick access, study streak and an activity heatmap.
- **Search everything** with ⌘K / Ctrl+K (topics, study guides, notes, questions), and a filterable **All topics** library (track, status, difficulty, tag, favourites, sort).
- **Light and dark themes**, responsive layout with a mobile drawer, loading/empty/error states throughout.
- **Backup and restore** the whole workspace as JSON from Settings.
- **Optional password lock** (`APP_PASSWORD`) for public deployments.

## Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript | One deployable unit for UI and API |
| Styling | Tailwind CSS 4 with CSS-variable design tokens | Notion-like light/dark themes |
| Data fetching | TanStack Query | Caching, optimistic updates, invalidation |
| Database | SQLite via libSQL + Drizzle ORM | Zero-setup locally; free hosted option (Turso) in production |
| Validation | Zod on every API input | Consistent 400 errors with field messages |
| Editor | Markdown + react-markdown, remark-gfm, rehype-highlight | Portable notes, code highlighting |
| Tests | Playwright end-to-end | Exercises the real UI and API |

## Run locally

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
# open http://localhost:3000
```

On first start the app creates `./data/prep.db` and seeds the starter curriculum. Delete the `data/` folder to start over. To start with an empty workspace, set `SKIP_SEED=1`.

Other scripts:

```bash
npm run build && npm start   # production build
npm run lint                 # ESLint
npm run typecheck            # TypeScript
npm run test:e2e             # Playwright (builds and starts the app on port 3200 with its own DB)
npm run seed:build           # recompile src/db/seed/content/*.md into data.json
```

## Deploy for free

The app needs a persistent database, so pick one of these options. Both are free.

### Option A: Vercel + Turso (recommended)

1. **Create a database on [Turso](https://turso.tech)** (free tier):
   ```bash
   brew install tursodatabase/tap/turso   # or: curl -sSfL https://get.tur.so/install.sh | bash
   turso auth signup
   turso db create interview-prep
   turso db show interview-prep --url      # -> libsql://interview-prep-<you>.turso.io
   turso db tokens create interview-prep   # -> auth token
   ```
2. **Import the repo on [Vercel](https://vercel.com/new)** (Hobby plan). The defaults (Next.js preset) work.
3. **Add environment variables** in the Vercel project settings:
   - `DATABASE_URL` = the `libsql://…` URL
   - `DATABASE_AUTH_TOKEN` = the token
   - `APP_PASSWORD` = a long password (strongly recommended, otherwise anyone with the URL can edit your workspace)
4. **Deploy.** Tables are created and the curriculum is seeded automatically on the first request.

### Option B: Docker with a volume (Fly.io, Railway, a home server…)

```bash
docker build -t interview-prep .
docker run -p 3000:3000 -v prep-data:/app/data -e APP_PASSWORD=change-me interview-prep
```

The SQLite file lives in the `/app/data` volume, so data survives restarts and redeploys. On Fly.io, create a volume (`fly volumes create data`) and mount it at `/app/data`.

> Serverless platforms without a persistent disk (for example Vercel without Turso) can't keep a local SQLite file. Use Option A there.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `file:./data/prep.db` | libSQL/SQLite URL. Use `libsql://…` for Turso. |
| `DATABASE_AUTH_TOKEN` | – | Auth token for a hosted libSQL database. |
| `APP_PASSWORD` | – | When set, every page and API call requires signing in. |
| `SKIP_SEED` | – | Set to `1` to skip the starter curriculum on a fresh database. |

## Project structure

```
src/
  app/                 Routes (pages) and API route handlers under app/api
  components/          UI: sidebar, dashboard, topic page, editor, dialogs, primitives
  db/
    schema.ts          Drizzle schema
    index.ts           Client, schema bootstrap, one-time seeding
    seed/content/*.md  Starter curriculum (human-editable), compiled to data.json
  lib/
    server/            Services (business logic), backup, HTTP helpers
    validation.ts      Zod schemas for every API input
    hooks.ts           TanStack Query hooks and mutations
  proxy.ts             Optional password gate
tests/                 Playwright end-to-end tests
```

### Data model

- **tracks**: name, icon, description, position
- **topics**: track, optional parent (nesting), title, icon, summary, status, difficulty, tags, study-guide sections (JSON), favourite, confidence, review schedule, timestamps
- **questions**, **notes**, **checklist_items**, **resources**: belong to a topic
- **activity**: an append-only log that powers the heatmap, streak and recent activity

### API

All endpoints accept and return JSON and validate input with Zod (`400` with a message on bad input, `404` for missing records).

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/tree` | Tracks and topic outline for the sidebar |
| GET, POST | `/api/tracks` | List / create tracks |
| PATCH, DELETE | `/api/tracks/:id` | Update / delete a track (cascades) |
| POST | `/api/tracks/reorder` | Persist track order |
| GET, POST | `/api/topics` | List with filters (`q`, `trackId`, `status`, `difficulty`, `tag`, `pinned`, `sort`) / create |
| GET, PATCH, DELETE | `/api/topics/:id` | Full topic with children / update (incl. move, sections) / delete with subtopics |
| POST | `/api/topics/reorder` | Persist sibling order |
| POST | `/api/topics/:id/review` | Log a revision with confidence 1–5 |
| POST | `/api/topics/:id/visit` | Record a visit (recently studied) |
| GET, POST | `/api/questions` | List with filters / create |
| PATCH, DELETE | `/api/questions/:id` | Update / delete |
| POST | `/api/questions/:id/practice` | Record a practice result (`again`, `good`, `easy`) |
| GET, POST | `/api/notes` · PATCH, DELETE `/api/notes/:id` | Notes |
| POST · PATCH, DELETE | `/api/checklist`, `/api/checklist/:id` | Checklist items |
| POST · PATCH, DELETE | `/api/resources`, `/api/resources/:id` | Resource links |
| GET | `/api/dashboard` | Aggregated progress, queues and activity |
| GET | `/api/search?q=` | Search topics, notes and questions |
| GET | `/api/tags` | Tags with counts |
| GET, POST | `/api/backup` | Export / restore everything |

## Editing the starter curriculum

The seed content lives in readable Markdown files in `src/db/seed/content/`. Edit them, run `npm run seed:build`, and delete `data/` to reseed locally. (A deployed database is only seeded once, so your own edits are never overwritten.)
