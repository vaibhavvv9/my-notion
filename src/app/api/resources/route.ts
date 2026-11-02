import { body, route } from "@/lib/server/http";
import { createResource } from "@/lib/server/children";
import { resourceCreate } from "@/lib/validation";

export const POST = route(async (req) => createResource(resourceCreate.parse(await body(req))));
