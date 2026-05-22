import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { AppProviders } from "./providers";
import { authStore } from "../features/auth/authStore";

const cityFixtures = [
  {
    id: "city-1",
    name: "Yekaterinburg",
    region: "Sverdlovsk Oblast",
    country: "Russia",
    active: true
  },
  {
    id: "city-2",
    name: "Tyumen",
    region: "Tyumen Oblast",
    country: "Russia",
    active: true
  }
];

const routeFixtures = [
  {
    id: "route-1",
    fromCityId: "city-1",
    toCityId: "city-2",
    distanceKm: 330,
    estimatedDurationMinutes: 260,
    active: true
  }
];

const tripFixtures = [
  {
    id: "trip-1",
    routeId: "route-1",
    departureTime: "2026-06-01T08:20:00Z",
    arrivalTime: "2026-06-01T12:40:00Z",
    totalSeats: 40,
    availableSeats: 18,
    totalCargoVolume: 12,
    availableCargoVolume: 8,
    price: 1200,
    status: "SCHEDULED",
    version: 1
  }
];

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders>
        <App />
      </AppProviders>
    </MemoryRouter>
  );
}

describe("App routes", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", createDefaultFetchMock());
  });

  afterEach(() => {
    cleanup();
    authStore.clearToken();
    vi.restoreAllMocks();
  });

  it("shows search page on root", () => {
    renderApp("/");

    expect(screen.getByRole("heading", { name: "Find a trip" })).toBeInTheDocument();
  });

  it("loads cities and routes on the search page", async () => {
    renderApp("/");

    expect(screen.getByText("Loading cities and routes")).toBeInTheDocument();
    expect(await screen.findByText("Yekaterinburg")).toBeInTheDocument();
    expect(screen.getByText("Tyumen")).toBeInTheDocument();
    expect(screen.getByText("330 km")).toBeInTheDocument();
  });

  it("shows login page", () => {
    renderApp("/login");

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  });

  it("redirects protected bookings page to login when unauthenticated", () => {
    renderApp("/bookings");

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  });

  it("shows protected bookings page when authenticated", () => {
    authStore.setToken("jwt-123");

    renderApp("/bookings");

    expect(screen.getByRole("heading", { name: "My bookings" })).toBeInTheDocument();
  });

  it("updates visible route after search", async () => {
    const user = userEvent.setup();
    renderApp("/");

    await user.clear(screen.getByLabelText("From"));
    await user.type(screen.getByLabelText("From"), "Perm");
    await user.clear(screen.getByLabelText("To"));
    await user.type(screen.getByLabelText("To"), "Kazan");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(screen.getByText(/Showing Perm -> Kazan/)).toBeInTheDocument();
  });

  it("searches trips by route and date", async () => {
    const user = userEvent.setup();
    const fetchMock = createDefaultFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    renderApp("/");

    await screen.findByText("330 km");
    await user.clear(screen.getByLabelText("From"));
    await user.type(screen.getByLabelText("From"), "Yekaterinburg");
    await user.clear(screen.getByLabelText("To"));
    await user.type(screen.getByLabelText("To"), "Tyumen");
    await user.type(screen.getByLabelText("Date"), "2026-06-01");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("08:20")).toBeInTheDocument();
    expect(screen.getByText("18 seats available")).toBeInTheDocument();
    expect(screen.getByText("1200 RUB")).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([request]) => requestUrl(request).includes("/api/trips/search"))).toBe(
      true
    );
    expect(fetchMock.mock.calls.some(([request]) => requestUrl(request).includes("routeId=route-1"))).toBe(
      true
    );
    expect(fetchMock.mock.calls.some(([request]) => requestUrl(request).includes("date=2026-06-01"))).toBe(
      true
    );
  });


  it("sends unauthenticated booking clicks to login", async () => {
    const user = userEvent.setup();
    renderApp("/");

    await screen.findByText("330 km");
    await user.type(screen.getByLabelText("Date"), "2026-06-01");
    await user.click(screen.getByRole("button", { name: "Search" }));
    await screen.findByText("08:20");
    await user.click(screen.getAllByRole("button", { name: "Book" })[0]);

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  });

  it("submits login and stores token", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ accessToken: "jwt-from-api" })
      })
    );
    renderApp("/login");

    await user.type(screen.getByLabelText("Email"), "passenger@example.com");
    await user.type(screen.getByLabelText("Password"), "pass12345");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(authStore.getToken()).toBe("jwt-from-api");
    expect(await screen.findByRole("heading", { name: "Find a trip" })).toBeInTheDocument();
  });

  it("logs out and redirects to login", async () => {
    const user = userEvent.setup();
    authStore.setToken("jwt-123");
    renderApp("/profile");

    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(authStore.getToken()).toBeNull();
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  });

  it("loads current user profile", async () => {
    authStore.setToken("jwt-123");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: "user-id",
            email: "passenger@example.com",
            phone: "+79990000000",
            fullName: "Passenger One",
            enabled: true,
            roles: ["PASSENGER"],
            createdAt: "2026-05-22T00:00:00Z",
            updatedAt: "2026-05-22T00:00:00Z"
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" }
          }
        )
      )
    );

    renderApp("/profile");

    expect(screen.getByText("Loading profile")).toBeInTheDocument();
    expect(await screen.findByText("Passenger One")).toBeInTheDocument();
    expect(screen.getByText("passenger@example.com")).toBeInTheDocument();
    expect(screen.getByText("PASSENGER")).toBeInTheDocument();
  });
});

function createDefaultFetchMock() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = input instanceof Request ? input.url : String(input);

    if (url.endsWith("/api/cities")) {
      return jsonResponse(cityFixtures);
    }
    if (url.endsWith("/api/routes")) {
      return jsonResponse(routeFixtures);
    }
    if (url.includes("/api/trips/search")) {
      return jsonResponse(tripFixtures);
    }

    return jsonResponse({ message: "Unhandled test request" }, 404);
  });
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

function requestUrl(request: RequestInfo | URL) {
  return request instanceof Request ? request.url : String(request);
}
