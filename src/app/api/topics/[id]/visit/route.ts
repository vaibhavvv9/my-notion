import { route, type IdCtx } from "@/lib/server/http";
import { visitTopic } from "@/lib/server/service";

export const POST = route<IdCtx>(async (_req, { params }) => visitTopic((await params).id));
