import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataPanel } from "./DataPanel";

describe("DataPanel", () => {
  it("renders a titled panel", () => {
    render(
      <DataPanel eyebrow="Schedule" title="Upcoming assignments">
        <p>Trip row</p>
      </DataPanel>
    );

    expect(screen.getByText("Schedule")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Upcoming assignments" })).toBeInTheDocument();
    expect(screen.getByText("Trip row")).toBeInTheDocument();
  });
});
