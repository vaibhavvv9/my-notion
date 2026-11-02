import { body, route, type IdCtx } from "@/lib/server/http";
import { deleteQuestion, updateQuestion } from "@/lib/server/children";
import { questionUpdate } from "@/lib/validation";

export const PATCH = route<IdCtx>(async (req, { params }) =>
  updateQuestion((await params).id, questionUpdate.parse(await body(req))),
);
export const DELETE = route<IdCtx>(async (_req, { params }) => deleteQuestion((await params).id));
