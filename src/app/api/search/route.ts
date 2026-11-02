import { route } from "@/lib/server/http";
import { search } from "@/lib/server/service";

export const GET = route(async (req) => search((new URL(req.url).searchParams.get("q") ?? "").slice(0, 200)));
