import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ApiErrorMessage } from "./ApiErrorMessage";

describe("ApiErrorMessage", () => {
  it("renders a formatted backend error", () => {
    render(
      <ApiErrorMessage
        error={{
          status: 400,
          error: "Bad Request",
          message: "routeId is required",
          timestamp: "2026-05-23T00:00:00Z",
          path: "/api/trips/search"
        }}
        fallback="Could not search trips"
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent("400 Bad Request: routeId is required");
  });
});
