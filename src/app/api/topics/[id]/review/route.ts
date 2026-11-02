import { body, route, type IdCtx } from "@/lib/server/http";
import { reviewTopic } from "@/lib/server/service";
import { review } from "@/lib/validation";

export const POST = route<IdCtx>(async (req, { params }) =>
  reviewTopic((await params).id, review.parse(await body(req)).confidence),
);
