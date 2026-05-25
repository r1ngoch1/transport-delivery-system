import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "./AppShell";

vi.mock("../../features/notifications/NotificationCenter", () => ({
  NotificationCenter: () => null
}));

describe("AppShell", () => {
  it("renders role-aware navigation links", () => {
    render(
      <MemoryRouter>
        <AppShell isAuthenticated isAdmin isDriver notificationsEnabled onLogout={vi.fn()}>
          <main>Page content</main>
        </AppShell>
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "RouteFlow" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Trips" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Cargo" })).toHaveAttribute("href", "/cargo");
    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute("href", "/admin");
    expect(screen.getByRole("link", { name: "Driver" })).toHaveAttribute("href", "/driver");
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("calls logout when logout is clicked", async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();

    render(
      <MemoryRouter>
        <AppShell isAuthenticated isAdmin={false} isDriver={false} notificationsEnabled={false} onLogout={onLogout}>
          <main>Page content</main>
        </AppShell>
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
