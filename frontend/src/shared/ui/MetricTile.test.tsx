import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { MetricTile } from "./MetricTile";

describe("MetricTile", () => {
  it("renders as a link when href is provided", () => {
    render(
      <MemoryRouter>
        <MetricTile href="/admin/trips" label="Trips" value="12" />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Trips 12" })).toHaveAttribute("href", "/admin/trips");
  });
});
