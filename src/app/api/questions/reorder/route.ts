import { body, route } from "@/lib/server/http";
import { reorderQuestions } from "@/lib/server/children";
import { reorder } from "@/lib/validation";

export const POST = route(async (req) => reorderQuestions(reorder.parse(await body(req)).ids));
