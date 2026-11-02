import { body, route, type IdCtx } from "@/lib/server/http";
import { deleteResource, updateResource } from "@/lib/server/children";
import { resourceUpdate } from "@/lib/validation";

export const PATCH = route<IdCtx>(async (req, { params }) =>
  updateResource((await params).id, resourceUpdate.parse(await body(req))),
);
export const DELETE = route<IdCtx>(async (_req, { params }) => deleteResource((await params).id));
