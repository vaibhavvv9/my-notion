import { body, route, type IdCtx } from "@/lib/server/http";
import { deleteTrack, updateTrack } from "@/lib/server/service";
import { trackUpdate } from "@/lib/validation";

export const PATCH = route<IdCtx>(async (req, { params }) =>
  updateTrack((await params).id, trackUpdate.parse(await body(req))),
);
export const DELETE = route<IdCtx>(async (_req, { params }) => deleteTrack((await params).id));
