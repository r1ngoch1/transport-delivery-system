import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "./AppShell";
import { LanguageProvider } from "../i18n/i18n";

vi.mock("../../features/notifications/NotificationCenter", () => ({
  NotificationCenter: () => null
}));

describe("AppShell", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders role-aware navigation links", () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <AppShell isAuthenticated isAdmin isDriver notificationsEnabled onLogout={vi.fn()}>
            <main>Page content</main>
          </AppShell>
        </LanguageProvider>
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
        <LanguageProvider>
          <AppShell isAuthenticated isAdmin={false} isDriver={false} notificationsEnabled={false} onLogout={onLogout}>
            <main>Page content</main>
          </AppShell>
        </LanguageProvider>
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("switches the shell labels to Russian", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LanguageProvider>
          <AppShell isAuthenticated={false} isAdmin={false} isDriver={false} notificationsEnabled={false} onLogout={vi.fn()}>
            <main>Page content</main>
          </AppShell>
        </LanguageProvider>
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "RU" }));

    expect(screen.getByRole("link", { name: "Рейсы" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Вход" })).toBeInTheDocument();
  });
});
