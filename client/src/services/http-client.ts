import { API_BASE_URL, API_TIMEOUT } from "@/config/api";
import { getSessionToken } from "@/stores/session-store";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type HttpOptions<TBody = unknown> = {
  method?: HttpMethod;
  body?: TBody;
  headers?: HeadersInit;
  cache?: RequestCache;
};

export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public payload?: unknown
  ) {
    super(message);
  }
}

export async function httpClient<TResponse, TBody = unknown>(
  path: string,
  options: HttpOptions<TBody> = {}
): Promise<TResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const token = getSessionToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      body: options.body ? JSON.stringify(options.body) : undefined,
      headers,
      signal: controller.signal,
      cache: options.cache,
    });

    const isJson = response.headers
      .get("content-type")
      ?.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      throw new HttpError(
        "API request failed",
        response.status,
        payload ?? undefined
      );
    }

    return payload as TResponse;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new HttpError("API request timed out", 408);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
