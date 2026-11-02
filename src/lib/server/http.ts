import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = (what = "Resource") => new HttpError(404, `${what} not found`);

type Handler<C> = (req: Request, ctx: C) => Promise<unknown>;

/** Wraps a route handler with JSON serialisation and consistent error responses. */
export function route<C = unknown>(fn: Handler<C>) {
  return async (req: Request, ctx: C) => {
    try {
      const result = await fn(req, ctx);
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true });
    } catch (err) {
      if (err instanceof ZodError) {
        const issue = err.issues[0];
        const path = issue?.path.join(".");
        return NextResponse.json(
          { error: path ? `${path}: ${issue.message}` : (issue?.message ?? "Invalid input"), issues: err.issues },
          { status: 400 },
        );
      }
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof SyntaxError) {
        return NextResponse.json({ error: "Malformed JSON body" }, { status: 400 });
      }
      console.error(err);
      return NextResponse.json({ error: "Something went wrong on the server" }, { status: 500 });
    }
  };
}

export async function body(req: Request): Promise<unknown> {
  const text = await req.text();
  return text ? JSON.parse(text) : {};
}

export type IdCtx = { params: Promise<{ id: string }> };
