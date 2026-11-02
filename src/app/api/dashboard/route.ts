import { route } from "@/lib/server/http";
import { getDashboard } from "@/lib/server/service";

export const GET = route(async (req) => {
  const tz = Number(new URL(req.url).searchParams.get("tz") ?? 0);
  return getDashboard(Number.isFinite(tz) ? Math.max(-840, Math.min(840, tz)) : 0);
});
