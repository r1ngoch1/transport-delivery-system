import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("renders eyebrow, title, subtitle, and actions", () => {
    render(
      <PageHeader eyebrow="Network" title="Trips" subtitle="Search active route capacity.">
        <button type="button">Refresh</button>
      </PageHeader>
    );

    expect(screen.getByText("Network")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Trips" })).toBeInTheDocument();
    expect(screen.getByText("Search active route capacity.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  });
});
