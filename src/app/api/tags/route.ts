import { route } from "@/lib/server/http";
import { listTags } from "@/lib/server/service";

export const GET = route(() => listTags());
