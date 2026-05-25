import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RouteMapPreview } from "./RouteMapPreview";

describe("RouteMapPreview", () => {
  it("renders selected route details", () => {
    render(
      <RouteMapPreview
        from="Yekaterinburg"
        to="Tyumen"
        distanceKm={330}
        durationMinutes={260}
        capacityLabel="18 seats available"
      />
    );

    expect(screen.getByRole("img", { name: "Route from Yekaterinburg to Tyumen" })).toBeInTheDocument();
    expect(screen.getByText("Yekaterinburg")).toBeInTheDocument();
    expect(screen.getByText("Tyumen")).toBeInTheDocument();
    expect(screen.getByText("330 km")).toBeInTheDocument();
    expect(screen.getByText("4h 20m")).toBeInTheDocument();
    expect(screen.getByText("18 seats available")).toBeInTheDocument();
  });

  it("renders empty route state", () => {
    render(<RouteMapPreview from="" to="" />);

    expect(screen.getByText("Choose a route to preview distance and capacity.")).toBeInTheDocument();
  });
});
