import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusChip } from "./StatusChip";

describe("StatusChip", () => {
  it("renders confirmed status as success", () => {
    render(<StatusChip status="CONFIRMED" />);

    expect(screen.getByText("CONFIRMED")).toHaveClass("status-success");
  });

  it("renders failed status as danger", () => {
    render(<StatusChip status="FAILED" />);

    expect(screen.getByText("FAILED")).toHaveClass("status-danger");
  });
});
