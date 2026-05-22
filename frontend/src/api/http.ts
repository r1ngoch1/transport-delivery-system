import { authStore } from "../features/auth/authStore";
import { API_BASE_URL } from "./config";
import type { ApiErrorResponse } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: ApiErrorResponse
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<TResponse = void>(
  path: string,
  init: RequestInit = {}
): Promise<TResponse> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...headersToRecord(init.headers)
  };

  const token = authStore.getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const payload = await parseJson<ApiErrorResponse>(response);
    throw new ApiError(payload?.message ?? `Request failed with ${response.status}`, response.status, payload);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return parseJson<TResponse>(response) as Promise<TResponse>;
}

async function parseJson<T>(response: Response): Promise<T | undefined> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined;
  }
  return response.json() as Promise<T>;
}

function headersToRecord(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) {
    return {};
  }
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return headers;
}
