import { body, route } from "@/lib/server/http";
import { createChecklistItem } from "@/lib/server/children";
import { checklistCreate } from "@/lib/validation";

export const POST = route(async (req) => createChecklistItem(checklistCreate.parse(await body(req))));
