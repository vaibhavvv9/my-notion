import { body, route, type IdCtx } from "@/lib/server/http";
import { deleteTopic, getTopic, updateTopic } from "@/lib/server/service";
import { topicUpdate } from "@/lib/validation";

export const GET = route<IdCtx>(async (_req, { params }) => getTopic((await params).id));
export const PATCH = route<IdCtx>(async (req, { params }) =>
  updateTopic((await params).id, topicUpdate.parse(await body(req))),
);
export const DELETE = route<IdCtx>(async (_req, { params }) => deleteTopic((await params).id));
