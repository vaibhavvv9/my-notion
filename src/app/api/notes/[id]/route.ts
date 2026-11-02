import { body, route, type IdCtx } from "@/lib/server/http";
import { deleteNote, updateNote } from "@/lib/server/children";
import { noteUpdate } from "@/lib/validation";

export const PATCH = route<IdCtx>(async (req, { params }) => updateNote((await params).id, noteUpdate.parse(await body(req))));
export const DELETE = route<IdCtx>(async (_req, { params }) => deleteNote((await params).id));
