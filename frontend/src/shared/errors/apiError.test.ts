import { describe, expect, it } from "vitest";
import { formatApiError, toDisplayError } from "./apiError";

describe("api error formatting", () => {
  it("formats backend ApiExceptionHandler payloads with status and message", () => {
    expect(
      formatApiError(
        {
          timestamp: "2026-05-23T00:00:00Z",
          status: 409,
          error: "Conflict",
          message: "Seat already reserved",
          path: "/api/bookings"
        },
        "Could not create booking"
      )
    ).toBe("409 Conflict: Seat already reserved");
  });

  it("uses the fallback when the error shape is unknown", () => {
    expect(formatApiError({ detail: "not the backend shape" }, "Could not load routes")).toBe(
      "Could not load routes"
    );
  });

  it("formats Error instances for display", () => {
    expect(toDisplayError(new Error("Gateway is unavailable"), "Could not load profile")).toBe(
      "Gateway is unavailable"
    );
  });

  it("formats ApiError-like objects by backend payload", () => {
    expect(
      formatApiError(
        {
          message: "Seat already reserved",
          payload: {
            timestamp: "2026-05-23T00:00:00Z",
            status: 409,
            error: "Conflict",
            message: "Seat already reserved",
            path: "/api/bookings"
          }
        },
        "Could not create booking"
      )
    ).toBe("409 Conflict: Seat already reserved");
  });
});
