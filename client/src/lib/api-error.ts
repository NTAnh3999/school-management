import { isAxiosError } from "axios";

// API errors arrive as { message, details: { error_code } } (snake_cased by
// api/src/middleware/error.middleware.js).
type ErrorBody = { message?: string; details?: { error_code?: string } | null };

export function apiErrorStatus(error: unknown) {
  return isAxiosError(error) ? error.response?.status : undefined;
}

export function apiErrorCode(error: unknown) {
  if (!isAxiosError(error)) return undefined;
  return (error.response?.data as ErrorBody | undefined)?.details?.error_code;
}

export function isAccessError(error: unknown) {
  const status = apiErrorStatus(error);
  return status === 403 || status === 404;
}
