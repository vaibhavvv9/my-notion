import { NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_COOKIE, authToken, timingSafeEqual } from "@/lib/auth";
import { body, route } from "@/lib/server/http";

export const GET = route(async () => ({ enabled: !!process.env.APP_PASSWORD }));

export const POST = route(async (req) => {
  const password = process.env.APP_PASSWORD;
  if (!password) return { ok: true };
  const { password: attempt } = z.object({ password: z.string().max(200) }).parse(await body(req));
  // Small fixed delay to slow down guessing.
  await new Promise((r) => setTimeout(r, 400));
  const expected = await authToken(password);
  if (!timingSafeEqual(await authToken(attempt), expected)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
});

export const DELETE = route(async () => {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(AUTH_COOKIE);
  return res;
});
