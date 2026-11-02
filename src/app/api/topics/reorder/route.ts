import { body, route } from "@/lib/server/http";
import { reorderTopics } from "@/lib/server/service";
import { reorder } from "@/lib/validation";

export const POST = route(async (req) => reorderTopics(reorder.parse(await body(req)).ids));
