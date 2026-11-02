import { NextResponse } from "next/server";
import { body, route } from "@/lib/server/http";
import { exportAll, importAll } from "@/lib/server/backup";

export const GET = route(async () => {
  const data = await exportAll();
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="interview-prep-backup-${date}.json"`,
    },
  });
});
export const POST = route(async (req) => importAll(await body(req)));
