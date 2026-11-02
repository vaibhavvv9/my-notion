import { body, route } from "@/lib/server/http";
import { reorderTracks } from "@/lib/server/service";
import { reorder } from "@/lib/validation";

export const POST = route(async (req) => reorderTracks(reorder.parse(await body(req)).ids));
