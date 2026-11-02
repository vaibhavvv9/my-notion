export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(method: string, url: string, data?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: data !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }
  const text = await res.text();
  let json: unknown = undefined;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    /* non-JSON body */
  }
  if (!res.ok) {
    const msg = (json as { error?: string } | undefined)?.error ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, msg);
  }
  return json as T;
}

export const api = {
  get: <T>(url: string) => request<T>("GET", url),
  post: <T>(url: string, data?: unknown) => request<T>("POST", url, data ?? {}),
  patch: <T>(url: string, data: unknown) => request<T>("PATCH", url, data),
  del: <T>(url: string) => request<T>("DELETE", url),
};

export function qs(params: Record<string, string | number | boolean | undefined | null>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "" || v === false) continue;
    p.set(k, v === true ? "1" : String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}
