import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./http";
import { authStore } from "../features/auth/authStore";

describe("apiRequest", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    authStore.clearToken();
  });

  it("parses JSON responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ id: "1" })
      })
    );

    await expect(apiRequest<{ id: string }>("/api/test")).resolves.toEqual({ id: "1" });
  });

  it("attaches bearer token when present", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers()
    });
    vi.stubGlobal("fetch", fetchMock);
    authStore.setToken("jwt-123");

    await apiRequest("/api/test");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/test",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-123"
        })
      })
    );
  });

  it("throws ApiError with backend error payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          timestamp: "2026-05-22T00:00:00Z",
          status: 409,
          error: "Conflict",
          message: "Email already exists",
          path: "/api/auth/register"
        })
      })
    );

    await expect(apiRequest("/api/test")).rejects.toMatchObject({
      status: 409,
      payload: {
        message: "Email already exists"
      }
    });
  });
});
