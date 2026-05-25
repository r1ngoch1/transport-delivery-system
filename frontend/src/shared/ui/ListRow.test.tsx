import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ListRow } from "./ListRow";

describe("ListRow", () => {
  it("renders static content as an article", () => {
    render(<ListRow title="Booking booking-1" meta="Trip trip-1" />);

    expect(screen.getByRole("article", { name: "Booking booking-1" })).toBeInTheDocument();
    expect(screen.getByText("Trip trip-1")).toBeInTheDocument();
  });

  it("renders clickable content as a button", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ListRow title="Documents" meta="Cargo order" onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: "Documents Cargo order" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
