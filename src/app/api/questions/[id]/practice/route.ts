import { body, route, type IdCtx } from "@/lib/server/http";
import { practiceQuestion } from "@/lib/server/children";
import { practice } from "@/lib/validation";

export const POST = route<IdCtx>(async (req, { params }) =>
  practiceQuestion((await params).id, practice.parse(await body(req)).result),
);
