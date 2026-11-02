import { body, route } from "@/lib/server/http";
import { createTrack, listTree } from "@/lib/server/service";
import { trackCreate } from "@/lib/validation";

export const GET = route(async () => (await listTree()).tracks);
export const POST = route(async (req) => createTrack(trackCreate.parse(await body(req))));
