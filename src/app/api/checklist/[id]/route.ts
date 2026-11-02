import { body, route, type IdCtx } from "@/lib/server/http";
import { deleteChecklistItem, updateChecklistItem } from "@/lib/server/children";
import { checklistUpdate } from "@/lib/validation";

export const PATCH = route<IdCtx>(async (req, { params }) =>
  updateChecklistItem((await params).id, checklistUpdate.parse(await body(req))),
);
export const DELETE = route<IdCtx>(async (_req, { params }) => deleteChecklistItem((await params).id));
