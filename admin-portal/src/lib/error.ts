// Backend errors arrive as { error: true, message, details } (api/src/middleware/error.middleware.js).
// RTK Query surfaces that body as `error.data` on a FetchBaseQueryError.
interface ApiErrorBody {
  message?: string;
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error && typeof error === "object") {
    if ("data" in error) {
      const data = (error as { data?: unknown }).data;
      if (data && typeof data === "object" && "message" in data) {
        const message = (data as ApiErrorBody).message;
        if (typeof message === "string" && message) return message;
      }
    }
    if ("message" in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === "string" && message) return message;
    }
  }
  return fallback;
}
