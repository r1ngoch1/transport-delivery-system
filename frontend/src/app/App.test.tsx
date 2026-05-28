import { act, cleanup, render, screen, within } from "@testing-library/react";
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
    driverId: "driver-1",
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

const bookingFixtures = [
  {
    id: "booking-1",
    userId: "user-id",
    tripId: "trip-1",
    paymentId: "payment-1",
    seatNumber: "1",
    status: "PENDING",
    price: 1200,
    createdAt: "2026-05-23T00:00:00Z",
    updatedAt: "2026-05-23T00:00:00Z"
  }
];

const paymentFixtures = [
  {
    id: "payment-1",
    targetType: "BOOKING",
    targetId: "booking-1",
    userId: "user-id",
    amount: 1200,
    currency: "RUB",
    status: "SUCCESS",
    createdAt: "2026-05-23T00:00:00Z",
    updatedAt: "2026-05-23T00:00:00Z"
  },
  {
    id: "payment-cargo-1",
    targetType: "CARGO_ORDER",
    targetId: "cargo-1",
    userId: "user-id",
    amount: 600,
    currency: "RUB",
    status: "SUCCESS",
    createdAt: "2026-05-23T00:00:00Z",
    updatedAt: "2026-05-23T00:00:00Z"
  }
];

const userFixtures = [
  {
    id: "user-id",
    email: "passenger@example.com",
    phone: "+79990000000",
    fullName: "Passenger One",
    enabled: true,
    roles: ["PASSENGER"],
    createdAt: "2026-05-22T00:00:00Z",
    updatedAt: "2026-05-22T00:00:00Z"
  },
  {
    id: "admin-id",
    email: "admin@example.com",
    phone: "+79991111111",
    fullName: "Admin One",
    enabled: true,
    roles: ["ADMIN"],
    createdAt: "2026-05-22T00:00:00Z",
    updatedAt: "2026-05-22T00:00:00Z"
  },
  {
    id: "driver-user-1",
    email: "driver@example.com",
    phone: "+79992222222",
    fullName: "Driver One",
    enabled: true,
    roles: ["DRIVER"],
    createdAt: "2026-05-22T00:00:00Z",
    updatedAt: "2026-05-22T00:00:00Z"
  }
];

const driverFixtures = [
  {
    id: "driver-1",
    userId: "driver-user-1",
    fullName: "Driver One",
    phone: "+79992222222",
    licenseNumber: "A1234567",
    licenseCategory: "B",
    licenseExpiresAt: "2027-01-01",
    availabilityStatus: "AVAILABLE",
    active: true,
    createdAt: "2026-05-23T00:00:00Z",
    updatedAt: "2026-05-23T00:00:00Z"
  }
];

const driverAvailabilityFixtures = [
  {
    id: "slot-1",
    driverProfileId: "driver-1",
    startAt: "2026-06-01T08:00:00Z",
    endAt: "2026-06-01T18:00:00Z",
    note: "Day shift",
    createdAt: "2026-05-24T00:00:00Z",
    updatedAt: "2026-05-24T00:00:00Z"
  }
];

const cargoOrderFixtures = [
  {
    id: "cargo-1",
    userId: "user-id",
    tripId: "trip-1",
    description: "Documents",
    pickupCity: "Yekaterinburg",
    pickupAddress: "Lenina 1",
    dropoffCity: "Tyumen",
    dropoffAddress: "Respubliki 2",
    declaredValue: 2500,
    senderName: "Sender One",
    senderPhone: "+79990000001",
    recipientName: "Recipient One",
    recipientPhone: "+79990000002",
    weightKg: 12,
    lengthCm: 40,
    widthCm: 30,
    heightCm: 20,
    volumeM3: 0.024,
    price: 600,
    currency: "RUB",
    paymentId: "payment-cargo-1",
    status: "PAID",
    createdAt: "2026-05-23T00:00:00Z",
    updatedAt: "2026-05-23T00:00:00Z"
  }
];

type NotificationFixture = {
  id: string;
  recipientUserId: string;
  type: string;
  severity: string;
  status: string;
  title: string;
  body: string;
  entityType: string;
  entityId: string;
  deliveryChannel: string;
  eventId: string;
  createdAt: string;
  readAt: string | null;
};

let notificationFixtures: NotificationFixture[] = [
  {
    id: "notification-1",
    recipientUserId: "user-id",
    type: "BOOKING",
    severity: "SUCCESS",
    status: "UNREAD",
    title: "Booking confirmed",
    body: "Booking booking-1 payment succeeded.",
    entityType: "BOOKING",
    entityId: "booking-1",
    deliveryChannel: "IN_APP",
    eventId: "event-1",
    createdAt: "2026-05-23T00:00:00Z",
    readAt: null
  },
  {
    id: "notification-2",
    recipientUserId: "user-id",
    type: "CARGO",
    severity: "SUCCESS",
    status: "UNREAD",
    title: "Cargo order paid",
    body: "Cargo order cargo-1 payment succeeded.",
    entityType: "CARGO_ORDER",
    entityId: "cargo-1",
    deliveryChannel: "IN_APP",
    eventId: "event-2",
    createdAt: "2026-05-23T01:00:00Z",
    readAt: null
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

async function waitForRouteCatalog() {
  expect(await screen.findByText("Routes")).toBeInTheDocument();
  const catalog = screen.getByText("Routes").closest("div");
  expect(catalog).not.toBeNull();
  expect(within(catalog as HTMLElement).getByText("330 km")).toBeInTheDocument();
}

function tripList() {
  const list = document.querySelector(".trip-list");
  expect(list).not.toBeNull();
  return list as HTMLElement;
}

describe("App routes", () => {
  beforeEach(() => {
    notificationFixtures = notificationFixtures.map((notification) => ({
      ...notification,
      status: "UNREAD",
      readAt: null
    }));
    vi.stubGlobal("fetch", createDefaultFetchMock());
  });

  afterEach(() => {
    cleanup();
    authStore.clearToken();
    globalThis.localStorage?.removeItem("routeflow-locale");
    vi.restoreAllMocks();
  });

  it("shows search page on root", () => {
    renderApp("/");

    expect(screen.getByRole("heading", { name: "Find a trip" })).toBeInTheDocument();
  });

  it("loads cities and routes on the search page", async () => {
    renderApp("/");

    expect(screen.getByText("Loading cities and routes")).toBeInTheDocument();
    await waitForRouteCatalog();
    const catalog = screen.getByText("Routes").closest("div") as HTMLElement;
    expect(within(catalog).getByText("Yekaterinburg -> Tyumen")).toBeInTheDocument();
  });

  it("translates route catalog labels on the search page", async () => {
    globalThis.localStorage?.setItem("routeflow-locale", "ru");

    renderApp("/");

    expect(await screen.findByText("Маршруты")).toBeInTheDocument();
    expect(screen.getByText("Города")).toBeInTheDocument();
    expect(screen.queryByText("Routes")).not.toBeInTheDocument();
    expect(screen.queryByText("Cities")).not.toBeInTheDocument();
  });

  it("shows empty route catalog states on the search page", async () => {
    vi.stubGlobal("fetch", createDefaultFetchMock({ emptyRouteCatalog: true }));

    renderApp("/");

    expect(await screen.findByText("No cities available")).toBeInTheDocument();
    expect(screen.getByText("No routes available")).toBeInTheDocument();
    expect(screen.getAllByRole("status").map((state) => state.textContent)).toEqual(
      expect.arrayContaining(["No cities available", "No routes available"])
    );
  });

  it("shows backend route catalog errors on the search page", async () => {
    vi.stubGlobal("fetch", createDefaultFetchMock({ routeCatalogError: true }));

    renderApp("/");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "503 Service Unavailable: Route service unavailable"
    );
  });

  it("shows login page", () => {
    renderApp("/login");

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  });

  it("registers a driver account when driver role is selected", async () => {
    const user = userEvent.setup();
    const fetchMock = createDefaultFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    renderApp("/login");

    await user.click(screen.getByRole("button", { name: "Show register form" }));
    await user.selectOptions(screen.getByLabelText("Account type"), "DRIVER");
    await user.type(screen.getByLabelText("Email"), "new-driver@example.com");
    await user.type(screen.getByLabelText("Full name"), "New Driver");
    await user.type(screen.getByLabelText("Phone"), "+79993333333");
    await user.type(screen.getByLabelText("Password"), "driver123");
    await user.click(screen.getByRole("button", { name: "Register" }));

    const registerCall = fetchMock.mock.calls.find(
      ([request, init]) => requestUrl(request).endsWith("/api/auth/register") && requestMethod(request, init) === "POST"
    );
    expect(registerCall).toBeDefined();
    expect(JSON.parse(String(registerCall?.[1]?.body))).toMatchObject({ role: "DRIVER" });
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

  it("shows protected cargo page when authenticated", async () => {
    authStore.setToken("jwt-123");
    renderApp("/cargo");

    expect(await screen.findByRole("heading", { name: "My cargo orders" })).toBeInTheDocument();
    expect(await screen.findByText("Documents")).toBeInTheDocument();
    expect(await screen.findByText("Payment SUCCESS")).toBeInTheDocument();
    expect(screen.getByText("12 kg В· 0.024 m3")).toBeInTheDocument();
    expect(screen.getByText("Yekaterinburg -> Tyumen")).toBeInTheDocument();
  });

  it("shows admin navigation only for an admin user", async () => {
    authStore.setToken("jwt-admin");
    renderApp("/");

    expect(await screen.findByRole("link", { name: "Admin" })).toBeInTheDocument();
  });

  it("hides admin navigation for a passenger user", async () => {
    authStore.setToken("jwt-123");
    renderApp("/");

    await waitForRouteCatalog();
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
  });

  it("shows driver navigation only for a driver user", async () => {
    authStore.setToken("jwt-driver");
    renderApp("/");

    expect(await screen.findByRole("link", { name: "Driver" })).toBeInTheDocument();

    act(() => {
      authStore.setToken("jwt-123");
    });

    await waitForRouteCatalog();
    expect(screen.queryByRole("link", { name: "Driver" })).not.toBeInTheDocument();
  });

  it("shows cargo navigation for authenticated users", async () => {
    authStore.setToken("jwt-123");
    renderApp("/");

    expect(await screen.findByRole("link", { name: "Cargo" })).toBeInTheDocument();
  });

  it("shows unread notification badge, dropdown actions, and entity links", async () => {
    const user = userEvent.setup();
    authStore.setToken("jwt-123");
    renderApp("/");

    const notificationsButton = await screen.findByRole("button", { name: "Notifications 2 unread" });
    expect(notificationsButton).toBeInTheDocument();
    expect(await screen.findByRole("status", { name: "notification toast" })).toHaveTextContent("Cargo order paid");

    await user.click(notificationsButton);

    expect(screen.getByRole("heading", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByText("Booking confirmed")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Booking confirmed" })).toHaveAttribute(
      "href",
      "/bookings?bookingId=booking-1"
    );

    await user.click(screen.getByRole("button", { name: "Mark Booking confirmed as read" }));

    expect(await screen.findByRole("button", { name: "Notifications 1 unread" })).toBeInTheDocument();
  });

  it("opens all notifications screen and marks all notifications as read", async () => {
    const user = userEvent.setup();
    authStore.setToken("jwt-123");
    renderApp("/notifications");

    expect(await screen.findByRole("heading", { name: "All notifications" })).toBeInTheDocument();
    expect(screen.getByLabelText("Notification status")).toBeInTheDocument();
    expect(await screen.findByText("Cargo order paid")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mark all as read" }));

    expect(await screen.findByText("All notifications marked as read")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Notifications 0 unread" })).toBeInTheDocument();
  });

  it("refreshes current user roles when the auth token changes", async () => {
    authStore.setToken("jwt-123");
    renderApp("/");

    await waitForRouteCatalog();
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();

    act(() => {
      authStore.setToken("jwt-admin");
    });

    expect(await screen.findByRole("link", { name: "Admin" })).toBeInTheDocument();
  });

  it("blocks admin area for authenticated users without the admin role", async () => {
    authStore.setToken("jwt-123");
    renderApp("/admin");

    expect(await screen.findByRole("heading", { name: "Admin access required" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to trips" })).toHaveAttribute("href", "/");
  });

  it("blocks driver area for authenticated users without the driver role", async () => {
    authStore.setToken("jwt-123");
    renderApp("/driver");

    expect(await screen.findByRole("heading", { name: "Driver access required" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to trips" })).toHaveAttribute("href", "/");
  });

  it("opens the admin shell for admin users", async () => {
    authStore.setToken("jwt-admin");
    renderApp("/admin");

    expect(await screen.findByRole("heading", { name: "Admin dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Admin navigation" })).toBeInTheDocument();
    expect(screen.getByText("Operational workspace backed by the Admin Service facade.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Passenger flow" })).toHaveAttribute("href", "/");
  });

  it("loads admin dashboard summary from the admin facade", async () => {
    authStore.setToken("jwt-admin");
    renderApp("/admin");

    expect(await screen.findByText("3 records")).toBeInTheDocument();
    expect(screen.getByText("1 route")).toBeInTheDocument();
    expect(screen.getByText("1 trip")).toBeInTheDocument();
    expect(screen.getByText("1 booking")).toBeInTheDocument();
    expect(screen.getByText("2 payments")).toBeInTheDocument();
    expect(screen.getByText("Audit log is written by Admin Service runtime logs.")).toBeInTheDocument();
  });

  it("shows admin users with search, profile details, and unsupported lock action", async () => {
    const user = userEvent.setup();
    authStore.setToken("jwt-admin");
    renderApp("/admin/users");

    expect(await screen.findByRole("heading", { name: "Users" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Search users"), "Passenger");

    expect(screen.getAllByText("Passenger One").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Admin One")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Passenger One passenger@example.com" }));

    expect(screen.getByText("Roles: PASSENGER")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lock user unavailable" })).toBeDisabled();
  });

  it("creates a city from the admin routes screen and keeps delete disabled when backend lacks it", async () => {
    const user = userEvent.setup();
    const fetchMock = createDefaultFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    authStore.setToken("jwt-admin");
    renderApp("/admin/routes");

    expect(await screen.findByRole("heading", { name: "Cities and routes" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("City name"), "Perm");
    await user.type(screen.getByLabelText("Region"), "Perm Krai");
    await user.type(screen.getByLabelText("Country"), "Russia");
    await user.click(screen.getByRole("button", { name: "Create city" }));

    expect(await screen.findByText("City saved")).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([request, init]) => requestUrl(request).endsWith("/api/cities") && requestMethod(request, init) === "POST")).toBe(true);
    expect(screen.getByRole("button", { name: "Delete city unavailable" })).toBeDisabled();
  });

  it("updates trip status from the admin trips screen", async () => {
    const user = userEvent.setup();
    const fetchMock = createDefaultFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    authStore.setToken("jwt-admin");
    renderApp("/admin/trips");

    expect(await screen.findByRole("heading", { name: "Trips" })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Trip status"), "COMPLETED");
    await user.click(screen.getByRole("button", { name: "Update trip" }));

    expect(await screen.findByText("Trip updated")).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([request, init]) => requestUrl(request).endsWith("/api/trips/trip-1") && requestMethod(request, init) === "PATCH")).toBe(true);
  });

  it("shows admin bookings, payments, cargo, and audit sections", async () => {
    const user = userEvent.setup();
    authStore.setToken("jwt-admin");
    renderApp("/admin/bookings");

    expect(await screen.findByRole("heading", { name: "Bookings" })).toBeInTheDocument();
    expect(screen.getByText("Booking booking-1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel booking unavailable" })).toBeDisabled();

    await user.click(screen.getByRole("link", { name: "Payments" }));
    expect(await screen.findByRole("heading", { name: "Payments" })).toBeInTheDocument();
    expect(screen.getAllByText("Idempotency key not provided").length).toBeGreaterThanOrEqual(1);

    await user.click(within(screen.getByRole("navigation", { name: "Admin navigation" })).getByRole("link", { name: "Cargo" }));
    expect(await screen.findByRole("heading", { name: "Cargo orders" })).toBeInTheDocument();
    expect(screen.getAllByText("Documents").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText("Cargo status")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Cargo status"), "PAID");
    expect(screen.getByText("Sender One -> Recipient One")).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "Documents cargo-1" }));
    expect(screen.getByText("Lenina 1 -> Respubliki 2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel cargo order" }));
    expect(await screen.findByText("Cargo order cancelled")).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Audit" }));
    expect(await screen.findByRole("heading", { name: "Audit log" })).toBeInTheDocument();
    expect(screen.getByText("Use service logs filtered by admin_audit until an audit query endpoint exists.")).toBeInTheDocument();
  });

  it("opens driver workspace with profile and assigned trips", async () => {
    authStore.setToken("jwt-driver");
    renderApp("/driver");

    expect(await screen.findByRole("heading", { name: "Driver workspace" })).toBeInTheDocument();
    expect(screen.getByText("Driver One")).toBeInTheDocument();
    expect(screen.getByText("License A1234567")).toBeInTheDocument();
    expect(screen.getAllByText("AVAILABLE").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Upcoming assignments")).toBeInTheDocument();
    expect(await screen.findByText("Yekaterinburg -> Tyumen")).toBeInTheDocument();
    const routePreview = await screen.findByLabelText("Route preview");
    expect(within(routePreview).getByText("18 seats available")).toBeInTheDocument();
  });

  it("updates current driver profile availability", async () => {
    const user = userEvent.setup();
    const fetchMock = createDefaultFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    authStore.setToken("jwt-driver");
    renderApp("/driver");

    expect(await screen.findByRole("heading", { name: "Driver workspace" })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Availability status"), "UNAVAILABLE");
    await user.click(screen.getByRole("button", { name: "Save driver profile" }));

    expect(await screen.findByText("Driver profile saved")).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(
        ([request, init]) => requestUrl(request).endsWith("/api/drivers/me") && requestMethod(request, init) === "PATCH"
      )
    ).toBe(true);
  });

  it("creates a trip from the driver workspace", async () => {
    const user = userEvent.setup();
    const fetchMock = createDefaultFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    authStore.setToken("jwt-driver");
    renderApp("/driver");

    expect(await screen.findByRole("heading", { name: "Driver workspace" })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Route"), "route-1");
    await user.type(screen.getByLabelText("Departure time"), "2026-06-03T08:00");
    await user.type(screen.getByLabelText("Arrival time"), "2026-06-03T12:00");
    await user.type(screen.getByLabelText("Total seats"), "32");
    await user.type(screen.getByLabelText("Total cargo volume"), "10");
    await user.type(screen.getByLabelText("Price"), "1500");
    await user.click(screen.getByRole("button", { name: "Create trip" }));

    expect(await screen.findByText("Trip created")).toBeInTheDocument();
    const createTripCall = fetchMock.mock.calls.find(
      ([request, init]) => requestUrl(request).endsWith("/api/trips") && requestMethod(request, init) === "POST"
    );
    expect(createTripCall).toBeDefined();
    expect(JSON.parse(String(createTripCall?.[1]?.body))).toMatchObject({
      routeId: "route-1",
      totalSeats: 32,
      totalCargoVolume: 10,
      price: 1500
    });
  });

  it("blocks driver trip creation until the driver is available", async () => {
    const user = userEvent.setup();
    const fetchMock = createDefaultFetchMock({ driverUnavailable: true });
    vi.stubGlobal("fetch", fetchMock);
    authStore.setToken("jwt-driver");
    renderApp("/driver");

    expect(await screen.findByRole("heading", { name: "Driver workspace" })).toBeInTheDocument();
    expect(screen.getByText("Set availability to AVAILABLE before creating a trip")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Route"), "route-1");
    await user.type(screen.getByLabelText("Departure time"), "2026-06-03T08:00");
    await user.type(screen.getByLabelText("Arrival time"), "2026-06-03T12:00");
    await user.type(screen.getByLabelText("Total seats"), "32");
    await user.type(screen.getByLabelText("Total cargo volume"), "10");
    await user.type(screen.getByLabelText("Price"), "1500");
    await user.click(screen.getByRole("button", { name: "Create trip" }));

    expect(
      fetchMock.mock.calls.some(
        ([request, init]) => requestUrl(request).endsWith("/api/trips") && requestMethod(request, init) === "POST"
      )
    ).toBe(false);
  });

  it("manages current driver availability slots", async () => {
    const user = userEvent.setup();
    const fetchMock = createDefaultFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    authStore.setToken("jwt-driver");
    renderApp("/driver");

    expect(await screen.findByRole("heading", { name: "Driver workspace" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Availability" })).toBeInTheDocument();
    expect(await screen.findByText("Day shift")).toBeInTheDocument();
    expect(screen.getByText("Day shift")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Calendar" }));
    expect(screen.getByText("01 Jun")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Table" }));

    await user.type(screen.getByLabelText("Slot start"), "2026-06-02T08:00");
    await user.type(screen.getByLabelText("Slot end"), "2026-06-02T18:00");
    await user.type(screen.getByLabelText("Slot note"), "Second shift");
    await user.click(screen.getByRole("button", { name: "Create availability slot" }));

    expect(await screen.findByText("Availability slot created")).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(
        ([request, init]) =>
          requestUrl(request).endsWith("/api/drivers/me/availability") && requestMethod(request, init) === "POST"
      )
    ).toBe(true);

    await user.click(screen.getByRole("button", { name: "Edit availability slot Day shift" }));
    await user.clear(screen.getByLabelText("Slot note"));
    await user.type(screen.getByLabelText("Slot note"), "Updated shift");
    await user.click(screen.getByRole("button", { name: "Save availability slot" }));

    expect(await screen.findByText("Availability slot saved")).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(
        ([request, init]) =>
          requestUrl(request).endsWith("/api/drivers/me/availability/slot-1") &&
          requestMethod(request, init) === "PATCH"
      )
    ).toBe(true);

    await user.click(screen.getByRole("button", { name: "Delete availability slot Updated shift" }));

    expect(await screen.findByText("Availability slot deleted")).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(
        ([request, init]) =>
          requestUrl(request).endsWith("/api/drivers/me/availability/slot-1") &&
          requestMethod(request, init) === "DELETE"
      )
    ).toBe(true);
  });

  it("prevents creating overlapping driver availability slots", async () => {
    const user = userEvent.setup();
    const fetchMock = createDefaultFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    authStore.setToken("jwt-driver");
    renderApp("/driver");

    expect(await screen.findByRole("heading", { name: "Availability" })).toBeInTheDocument();
    expect(await screen.findByText("Day shift")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Slot start"), "2026-06-01T14:00");
    await user.type(screen.getByLabelText("Slot end"), "2026-06-01T16:00");
    await user.click(screen.getByRole("button", { name: "Create availability slot" }));

    expect(screen.getByText("Availability overlaps existing slot")).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(
        ([request, init]) =>
          requestUrl(request).endsWith("/api/drivers/me/availability") && requestMethod(request, init) === "POST"
      )
    ).toBe(false);
  });

  it("creates the current driver profile from onboarding state", async () => {
    const user = userEvent.setup();
    const fetchMock = createDefaultFetchMock({ missingDriverProfile: true });
    authStore.setToken("jwt-driver");
    vi.stubGlobal("fetch", fetchMock);
    renderApp("/driver");

    expect(await screen.findByRole("heading", { name: "Driver profile required" })).toBeInTheDocument();
    expect(screen.getByText("Create a driver profile before managing availability or assignments.")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Full name"), "Driver One");
    await user.type(screen.getByLabelText("Phone"), "+79992222222");
    await user.type(screen.getByLabelText("License number"), "A1234567");
    await user.type(screen.getByLabelText("License category"), "B");
    await user.type(screen.getByLabelText("License expiration date"), "2027-01-01");
    await user.click(screen.getByRole("button", { name: "Create driver profile" }));

    expect(await screen.findByText("Driver profile created")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Driver workspace" })).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(
        ([request, init]) => requestUrl(request).endsWith("/api/drivers/me") && requestMethod(request, init) === "POST"
      )
    ).toBe(true);
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

    await waitForRouteCatalog();
    await user.clear(screen.getByLabelText("From"));
    await user.type(screen.getByLabelText("From"), "Yekaterinburg");
    await user.clear(screen.getByLabelText("To"));
    await user.type(screen.getByLabelText("To"), "Tyumen");
    await user.type(screen.getByLabelText("Date"), "2026-06-01");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("08:20")).toBeInTheDocument();
    expect(within(tripList()).getByText("18 seats available")).toBeInTheDocument();
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

  it("does not show stale searched capacity in route preview after editing route fields", async () => {
    const user = userEvent.setup();
    renderApp("/");

    await waitForRouteCatalog();
    await user.type(screen.getByLabelText("Date"), "2026-06-01");
    await user.click(screen.getByRole("button", { name: "Search" }));

    const routePreview = await screen.findByLabelText("Route preview");
    expect(within(routePreview).getByText("18 seats available")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("From"));
    await user.type(screen.getByLabelText("From"), "Perm");

    expect(within(routePreview).queryByText("18 seats available")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Route from Perm to Tyumen" })).toBeInTheDocument();
    expect(within(tripList()).getByText("18 seats available")).toBeInTheDocument();
  });


  it("sends unauthenticated booking clicks to login", async () => {
    const user = userEvent.setup();
    renderApp("/");

    await waitForRouteCatalog();
    await user.type(screen.getByLabelText("Date"), "2026-06-01");
    await user.click(screen.getByRole("button", { name: "Search" }));
    await screen.findByText("08:20");
    await user.click(screen.getAllByRole("button", { name: "Book" })[0]);

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  });

  it("creates a booking for an authenticated passenger from search results", async () => {
    const user = userEvent.setup();
    const fetchMock = createDefaultFetchMock();
    authStore.setToken("jwt-123");
    vi.stubGlobal("fetch", fetchMock);
    renderApp("/");

    await waitForRouteCatalog();
    await user.type(screen.getByLabelText("Date"), "2026-06-01");
    await user.click(screen.getByRole("button", { name: "Search" }));
    await screen.findByText("08:20");
    await user.click(screen.getAllByRole("button", { name: "Book" })[0]);

    expect(await screen.findByText("Booking created")).toBeInTheDocument();
    expect(screen.getByText("PENDING")).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(
        ([request]) => requestUrl(request).endsWith("/api/bookings") && requestMethod(request) === "POST"
      )
    ).toBe(true);
  });

  it("creates a cargo order from cargo search results", async () => {
    const user = userEvent.setup();
    const fetchMock = createDefaultFetchMock();
    authStore.setToken("jwt-123");
    vi.stubGlobal("fetch", fetchMock);
    renderApp("/");

    await waitForRouteCatalog();
    await user.click(screen.getByRole("button", { name: "Cargo" }));
    await user.type(screen.getByLabelText("Date"), "2026-06-01");
    await user.type(screen.getByLabelText("Description"), "Documents");
    await user.type(screen.getByLabelText("Pickup address"), "Lenina 1");
    await user.type(screen.getByLabelText("Dropoff address"), "Respubliki 2");
    await user.type(screen.getByLabelText("Declared value"), "2500");
    await user.type(screen.getByLabelText("Sender name"), "Sender One");
    await user.type(screen.getByLabelText("Sender phone"), "+79990000001");
    await user.type(screen.getByLabelText("Recipient name"), "Recipient One");
    await user.type(screen.getByLabelText("Recipient phone"), "+79990000002");
    await user.type(screen.getByLabelText("Weight kg"), "12");
    await user.type(screen.getByLabelText("Length cm"), "40");
    await user.type(screen.getByLabelText("Width cm"), "30");
    await user.type(screen.getByLabelText("Height cm"), "20");
    await user.click(screen.getByRole("button", { name: "Search cargo space" }));

    await screen.findByText("Ship cargo");
    expect(within(tripList()).getByText("8 m3 cargo available")).toBeInTheDocument();
    expect(screen.getByText("Estimated cargo price 747.20 RUB")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ship cargo" }));

    expect(await screen.findByText("Cargo order created")).toBeInTheDocument();
    expect(screen.getByText("PAID")).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(
        ([request, init]) => requestUrl(request).endsWith("/api/cargo-orders") && requestMethod(request, init) === "POST"
      )
    ).toBe(true);
    const cargoPost = fetchMock.mock.calls.find(
      ([request, init]) => requestUrl(request).endsWith("/api/cargo-orders") && requestMethod(request, init) === "POST"
    );
    expect(cargoPost?.[1]?.body).toEqual(
      JSON.stringify({
        declaredValue: 2500,
        description: "Documents",
        dropoffAddress: "Respubliki 2",
        dropoffCity: "Tyumen",
        heightCm: 20,
        lengthCm: 40,
        pickupAddress: "Lenina 1",
        pickupCity: "Yekaterinburg",
        recipientName: "Recipient One",
        recipientPhone: "+79990000002",
        senderName: "Sender One",
        senderPhone: "+79990000001",
        tripId: "trip-1",
        weightKg: 12,
        widthCm: 30
      })
    );
  });

  it("cancels a current user's cargo order from details", async () => {
    const user = userEvent.setup();
    const fetchMock = createDefaultFetchMock();
    authStore.setToken("jwt-123");
    vi.stubGlobal("fetch", fetchMock);
    renderApp("/cargo");

    expect(await screen.findByRole("heading", { name: "My cargo orders" })).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "Documents cargo-1" }));
    expect(screen.getByText("Lenina 1 -> Respubliki 2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel cargo order" }));

    expect(await screen.findByText("Cargo order cancelled")).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(
        ([request, init]) =>
          requestUrl(request).endsWith("/api/cargo-orders/cargo-1/cancel") &&
          requestMethod(request, init) === "POST"
      )
    ).toBe(true);
  });

  it("validates cargo dimensions against selected trip capacity before creating an order", async () => {
    const user = userEvent.setup();
    const fetchMock = createDefaultFetchMock();
    authStore.setToken("jwt-123");
    vi.stubGlobal("fetch", fetchMock);
    renderApp("/");

    await waitForRouteCatalog();
    await user.click(screen.getByRole("button", { name: "Cargo" }));
    await user.type(screen.getByLabelText("Date"), "2026-06-01");
    await user.type(screen.getByLabelText("Description"), "Large crate");
    await user.type(screen.getByLabelText("Weight kg"), "12");
    await user.type(screen.getByLabelText("Length cm"), "400");
    await user.type(screen.getByLabelText("Width cm"), "400");
    await user.type(screen.getByLabelText("Height cm"), "600");
    await user.click(screen.getByRole("button", { name: "Search cargo space" }));
    await screen.findByText("Ship cargo");
    expect(within(tripList()).getByText("8 m3 cargo available")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ship cargo" }));

    expect(screen.getByText("Cargo volume exceeds available trip capacity")).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(
        ([request, init]) => requestUrl(request).endsWith("/api/cargo-orders") && requestMethod(request, init) === "POST"
      )
    ).toBe(false);
  });

  it("loads the current user's bookings", async () => {
    authStore.setToken("jwt-123");

    renderApp("/bookings");

    expect(screen.getByText("Loading bookings")).toBeInTheDocument();
    expect(await screen.findByText("Booking booking-1")).toBeInTheDocument();
    expect(screen.getByText("Trip trip-1")).toBeInTheDocument();
    expect(screen.getByText("Seat 1")).toBeInTheDocument();
    expect(screen.getByText("1200 RUB")).toBeInTheDocument();
  });

  it("shows payment status for current user's bookings", async () => {
    authStore.setToken("jwt-123");

    renderApp("/bookings");

    expect(await screen.findByText("Payment SUCCESS")).toBeInTheDocument();
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

function createDefaultFetchMock(
  options: {
    driverUnavailable?: boolean;
    emptyRouteCatalog?: boolean;
    missingDriverProfile?: boolean;
    routeCatalogError?: boolean;
  } = {}
) {
  let driverProfileCreated = false;
  let driverAvailabilitySlots = [...driverAvailabilityFixtures];
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    const method = requestMethod(input, init);

    if (url.endsWith("/api/cities") && method === "POST") {
      return jsonResponse({
        id: "city-3",
        name: "Perm",
        region: "Perm Krai",
        country: "Russia",
        active: true
      });
    }
    if (url.endsWith("/api/trips/trip-1") && method === "PATCH") {
      return jsonResponse({
        ...tripFixtures[0],
        status: "COMPLETED"
      });
    }
    if (url.endsWith("/api/auth/register") && method === "POST") {
      const body = JSON.parse(String(init?.body));
      return jsonResponse(
        {
          accessToken: body.role === "DRIVER" ? "jwt-driver" : "jwt-123",
          user: {
            id: body.role === "DRIVER" ? "driver-user-2" : "user-id",
            email: body.email,
            phone: body.phone,
            fullName: body.fullName,
            enabled: true,
            roles: [body.role],
            createdAt: "2026-05-25T00:00:00Z",
            updatedAt: "2026-05-25T00:00:00Z"
          }
        },
        201
      );
    }
    if (url.endsWith("/api/cities")) {
      if (options.routeCatalogError) {
        return jsonResponse(
          {
            timestamp: "2026-05-23T00:00:00Z",
            status: 503,
            error: "Service Unavailable",
            message: "Route service unavailable",
            path: "/api/cities"
          },
          503
        );
      }
      if (options.emptyRouteCatalog) {
        return jsonResponse([]);
      }
      return jsonResponse(cityFixtures);
    }
    if (url.endsWith("/api/routes")) {
      if (options.emptyRouteCatalog) {
        return jsonResponse([]);
      }
      return jsonResponse(routeFixtures);
    }
    if (url.endsWith("/api/admin/users")) {
      return jsonResponse(userFixtures);
    }
    if (url.endsWith("/api/admin/cities")) {
      return jsonResponse(cityFixtures);
    }
    if (url.endsWith("/api/admin/routes")) {
      return jsonResponse(routeFixtures);
    }
    if (url.endsWith("/api/admin/trips")) {
      return jsonResponse(tripFixtures);
    }
    if (url.includes("/api/trips?")) {
      return jsonResponse(tripFixtures);
    }
    if (url.endsWith("/api/trips") && method === "POST") {
      return jsonResponse(
        {
          ...JSON.parse(String(init?.body)),
          id: "trip-2",
          driverId: "driver-1",
          availableSeats: 32,
          availableCargoVolume: 10,
          version: 1
        },
        201
      );
    }
    if (url.endsWith("/api/admin/bookings")) {
      return jsonResponse(bookingFixtures);
    }
    if (url.endsWith("/api/admin/payments")) {
      return jsonResponse(paymentFixtures);
    }
    if (url.endsWith("/api/admin/drivers")) {
      return jsonResponse(driverFixtures);
    }
    if (url.endsWith("/api/drivers/me") && method === "PATCH") {
      return jsonResponse({
        ...driverFixtures[0],
        availabilityStatus: "UNAVAILABLE",
        updatedAt: "2026-05-24T00:00:00Z"
      });
    }
    if (url.endsWith("/api/drivers/me") && method === "POST") {
      driverProfileCreated = true;
      return jsonResponse(driverFixtures[0], 201);
    }
    if (url.endsWith("/api/drivers/me/availability") && method === "POST") {
      const slot = {
        id: "slot-2",
        driverProfileId: "driver-1",
        startAt: "2026-06-02T08:00:00.000Z",
        endAt: "2026-06-02T18:00:00.000Z",
        note: "Second shift",
        createdAt: "2026-05-24T00:00:00Z",
        updatedAt: "2026-05-24T00:00:00Z"
      };
      driverAvailabilitySlots = [...driverAvailabilitySlots, slot];
      return jsonResponse(slot, 201);
    }
    if (url.endsWith("/api/drivers/me/availability/slot-1") && method === "PATCH") {
      const slot = {
        ...driverAvailabilitySlots[0],
        note: "Updated shift",
        updatedAt: "2026-05-24T01:00:00Z"
      };
      driverAvailabilitySlots = [slot, ...driverAvailabilitySlots.slice(1)];
      return jsonResponse(slot);
    }
    if (url.endsWith("/api/drivers/me/availability/slot-1") && method === "DELETE") {
      driverAvailabilitySlots = driverAvailabilitySlots.filter((slot) => slot.id !== "slot-1");
      return new Response(null, { status: 204 });
    }
    if (url.endsWith("/api/drivers/me/availability")) {
      return jsonResponse(driverAvailabilitySlots);
    }
    if (url.endsWith("/api/drivers/me")) {
      if (options.missingDriverProfile && !driverProfileCreated) {
        return jsonResponse(
          {
            timestamp: "2026-05-24T00:00:00Z",
            status: 404,
            error: "Not Found",
            message: "Driver profile not found",
            path: "/api/drivers/me"
          },
          404
        );
      }
      return jsonResponse({
        ...driverFixtures[0],
        availabilityStatus: options.driverUnavailable ? "UNAVAILABLE" : driverFixtures[0].availabilityStatus
      });
    }
    if (url.endsWith("/api/admin/cargo-orders")) {
      return jsonResponse(cargoOrderFixtures);
    }
    if (url.endsWith("/api/cargo-orders/my")) {
      return jsonResponse(cargoOrderFixtures);
    }
    if (url.endsWith("/api/cargo-orders/cargo-1/cancel") && method === "POST") {
      return jsonResponse({
        ...cargoOrderFixtures[0],
        status: "CANCELLED",
        updatedAt: "2026-05-24T00:00:00Z"
      });
    }
    if (url.endsWith("/api/cargo-orders/admin/cargo-1/cancel") && method === "POST") {
      return jsonResponse({
        ...cargoOrderFixtures[0],
        status: "CANCELLED",
        updatedAt: "2026-05-24T00:00:00Z"
      });
    }
    if (url.endsWith("/api/cargo-orders") && method === "POST") {
      return jsonResponse(cargoOrderFixtures[0], 201);
    }
    if (url.includes("/api/notifications/unread-count")) {
      return jsonResponse({
        unreadCount: notificationFixtures.filter((notification) => notification.status === "UNREAD").length
      });
    }
    if (url.endsWith("/api/notifications/read-all") && method === "PATCH") {
      notificationFixtures = notificationFixtures.map((notification) => ({
        ...notification,
        status: "READ",
        readAt: "2026-05-24T00:00:00Z"
      }));
      return jsonResponse({ updatedCount: 2 });
    }
    if (url.endsWith("/api/notifications/notification-1/read") && method === "PATCH") {
      notificationFixtures = notificationFixtures.map((notification) =>
        notification.id === "notification-1"
          ? { ...notification, status: "READ", readAt: "2026-05-24T00:00:00Z" }
          : notification
      );
      return jsonResponse(notificationFixtures.find((notification) => notification.id === "notification-1"));
    }
    if (url.includes("/api/notifications")) {
      const parsedUrl = new URL(url);
      const status = parsedUrl.searchParams.get("status");
      const type = parsedUrl.searchParams.get("type");
      const data = notificationFixtures.filter(
        (notification) =>
          (!status || notification.status === status) &&
          (!type || notification.type === type)
      );
      return jsonResponse(data);
    }
    if (url.includes("/api/trips/search")) {
      return jsonResponse(tripFixtures);
    }
    if (url.endsWith("/api/bookings") && input instanceof Request && input.method === "POST") {
      return jsonResponse(bookingFixtures[0]);
    }
    if (url.endsWith("/api/bookings/my")) {
      return jsonResponse(bookingFixtures);
    }
    if (url.includes("/api/payments")) {
      return jsonResponse(paymentFixtures);
    }
    if (url.endsWith("/api/users/me")) {
      const authorization = input instanceof Request ? input.headers.get("Authorization") : "";
      const isAdminToken = authorization?.includes("jwt-admin") ?? false;
      const isDriverToken = authorization?.includes("jwt-driver") ?? false;
      const user = isAdminToken ? userFixtures[1] : isDriverToken ? userFixtures[2] : userFixtures[0];
      return jsonResponse({
        ...user
      });
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

function requestMethod(request: RequestInfo | URL, init?: RequestInit) {
  if (request instanceof Request) {
    return request.method;
  }
  return init?.method ?? "GET";
}
