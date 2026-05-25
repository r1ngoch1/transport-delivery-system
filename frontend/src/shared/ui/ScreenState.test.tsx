import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScreenState } from "./ScreenState";

describe("ScreenState", () => {
  it("renders loading states as accessible status", () => {
    render(<ScreenState kind="loading" message="Loading bookings" />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading bookings");
  });

  it("renders empty states as accessible status", () => {
    render(<ScreenState kind="empty" message="No trips found" />);

    expect(screen.getByRole("status")).toHaveTextContent("No trips found");
  });
});
