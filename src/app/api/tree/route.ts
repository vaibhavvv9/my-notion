import { route } from "@/lib/server/http";
import { listTree } from "@/lib/server/service";

export const GET = route(() => listTree());
