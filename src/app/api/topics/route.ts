import { body, route } from "@/lib/server/http";
import { createTopic, listTopics } from "@/lib/server/service";
import { topicCreate } from "@/lib/validation";

export const GET = route(async (req) => {
  const p = new URL(req.url).searchParams;
  return listTopics({
    q: p.get("q") || undefined,
    trackId: p.get("trackId") || undefined,
    status: p.get("status") || undefined,
    difficulty: p.get("difficulty") || undefined,
    tag: p.get("tag") || undefined,
    pinned: p.get("pinned") === "1",
    sort: p.get("sort") || undefined,
  });
});
export const POST = route(async (req) => createTopic(topicCreate.parse(await body(req))));
