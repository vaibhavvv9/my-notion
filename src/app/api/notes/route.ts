import { body, route } from "@/lib/server/http";
import { createNote, listNotes } from "@/lib/server/children";
import { noteCreate } from "@/lib/validation";

export const GET = route(async (req) => {
  const p = new URL(req.url).searchParams;
  return listNotes({ q: p.get("q") || undefined, pinned: p.get("pinned") === "1", trackId: p.get("trackId") || undefined });
});
export const POST = route(async (req) => createNote(noteCreate.parse(await body(req))));
