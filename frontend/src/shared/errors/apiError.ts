import type { ApiErrorResponse } from "../../api/types";

export function formatApiError(error: unknown, fallback: string): string {
  if (isApiErrorResponse(error)) {
    return formatApiErrorResponse(error);
  }

  const payload = getApiErrorPayload(error);
  if (payload) {
    return formatApiErrorResponse(payload);
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error && "message" in error) {
    const message = String(error.message);
    return message || fallback;
  }

  return fallback;
}

function formatApiErrorResponse(error: ApiErrorResponse): string {
  const statusPrefix = error.status && error.error ? `${error.status} ${error.error}` : error.error;
  return statusPrefix ? `${statusPrefix}: ${error.message}` : error.message;
}

export function toDisplayError(error: unknown, fallback: string): string {
  return formatApiError(error, fallback);
}

function getApiErrorPayload(error: unknown): ApiErrorResponse | undefined {
  if (typeof error !== "object" || error === null || !("payload" in error)) {
    return undefined;
  }

  const payload = (error as { payload?: unknown }).payload;
  return isApiErrorResponse(payload) ? payload : undefined;
}

function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    "status" in error &&
    "error" in error &&
    typeof (error as ApiErrorResponse).message === "string"
  );
}
