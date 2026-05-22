import { afterEach, describe, expect, it } from "vitest";
import { authStore } from "./authStore";

describe("authStore", () => {
  afterEach(() => {
    authStore.clearToken();
    window.localStorage.clear();
  });

  it("stores and reads the JWT token", () => {
    authStore.setToken("token-123");

    expect(authStore.getToken()).toBe("token-123");
    expect(window.localStorage.getItem("transport.jwt")).toBe("token-123");
  });

  it("clears the JWT token", () => {
    authStore.setToken("token-123");

    authStore.clearToken();

    expect(authStore.getToken()).toBeNull();
    expect(window.localStorage.getItem("transport.jwt")).toBeNull();
  });

  it("reports authentication state", () => {
    expect(authStore.isAuthenticated()).toBe(false);

    authStore.setToken("token-123");

    expect(authStore.isAuthenticated()).toBe(true);
  });

  it("notifies subscribers when token changes", () => {
    const observedTokens: Array<string | null> = [];
    const unsubscribe = authStore.subscribe((token) => observedTokens.push(token));

    authStore.setToken("token-123");
    authStore.clearToken();
    unsubscribe();
    authStore.setToken("token-456");

    expect(observedTokens).toEqual(["token-123", null]);
  });
});
