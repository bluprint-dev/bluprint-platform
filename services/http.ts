type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export class HttpError extends Error {
  status: number;
  body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const timeoutMs = init?.timeoutMs ?? 12_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(input, {
      ...init,
      signal: init?.signal ?? controller.signal,
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });

    const text = await res.text();
    const body = text ? (JSON.parse(text) as Json) : null;

    if (!res.ok) {
      throw new HttpError(`HTTP ${res.status}`, res.status, body);
    }

    return body as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts?: { retries?: number; baseDelayMs?: number }
): Promise<T> {
  const retries = opts?.retries ?? 2;
  const baseDelayMs = opts?.baseDelayMs ?? 250;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt >= retries) break;
      const jitter = Math.floor(Math.random() * 150);
      const delay = baseDelayMs * Math.pow(2, attempt) + jitter;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

