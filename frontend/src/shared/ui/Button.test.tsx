import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renders a primary button by default", () => {
    render(<Button>Search</Button>);

    expect(screen.getByRole("button", { name: "Search" })).toHaveClass("button-primary");
  });

  it("renders a secondary button", () => {
    render(<Button variant="secondary">Cancel</Button>);

    expect(screen.getByRole("button", { name: "Cancel" })).toHaveClass("button-secondary");
  });
});
