import { body, route } from "@/lib/server/http";
import { createQuestion, listQuestions } from "@/lib/server/children";
import { questionCreate } from "@/lib/validation";

export const GET = route(async (req) => {
  const p = new URL(req.url).searchParams;
  return listQuestions({
    trackId: p.get("trackId") || undefined,
    topicId: p.get("topicId") || undefined,
    status: p.get("status") || undefined,
    difficulty: p.get("difficulty") || undefined,
    q: p.get("q") || undefined,
  });
});
export const POST = route(async (req) => createQuestion(questionCreate.parse(await body(req))));
