#!/usr/bin/env node

const gatewayUrl = (process.env.GATEWAY_URL ?? "http://localhost:8080").replace(/\/$/, "");
const password = process.env.SMOKE_PASSWORD ?? "pass12345";
const seedRouteId = process.env.SMOKE_ROUTE_ID ?? "33333333-3333-3333-3333-333333333333";
const seedTripId = process.env.SMOKE_TRIP_ID ?? "44444444-4444-4444-4444-444444444444";
const tripDate = process.env.SMOKE_TRIP_DATE ?? "2026-06-01";
const seatNumber = process.env.SMOKE_SEAT_NUMBER ?? "1";

const dryRunPlan = {
  gatewayUrl,
  steps: [
    { method: "POST", path: "/api/auth/register" },
    { method: "POST", path: "/api/auth/login" },
    { method: "GET", path: "/api/users/me" },
    { method: "GET", path: "/api/cities" },
    { method: "GET", path: "/api/routes" },
    { method: "GET", path: `/api/trips/search?routeId=${seedRouteId}&date=${tripDate}` },
    { method: "POST", path: "/api/bookings" },
    { method: "GET", path: "/api/bookings/my" },
    { method: "GET", path: "/api/payments?targetType=BOOKING&targetId=<bookingId>" }
  ]
};

if (process.argv.includes("--dry-run")) {
  process.stdout.write(`${JSON.stringify(dryRunPlan, null, 2)}\n`);
  process.exit(0);
}

const stamp = Date.now();
const passenger = {
  email: `frontend-smoke-${stamp}@example.com`,
  phone: `+79${String(stamp).slice(-9)}`,
  password,
  fullName: "Frontend Smoke Passenger",
  role: "PASSENGER"
};

const register = await request("POST", "/api/auth/register", { body: passenger });
const login = await request("POST", "/api/auth/login", {
  body: {
    email: passenger.email,
    password: passenger.password
  }
});
const token = login.accessToken ?? register.accessToken;

if (!token) {
  throw new Error("Smoke login did not return accessToken");
}

await request("GET", "/api/users/me", { token });

const cities = await request("GET", "/api/cities");
if (!Array.isArray(cities) || cities.length === 0) {
  throw new Error("Gateway returned no cities");
}

const routes = await request("GET", "/api/routes");
if (!Array.isArray(routes) || routes.length === 0) {
  throw new Error("Gateway returned no routes");
}

const trips = await request("GET", `/api/trips/search?routeId=${seedRouteId}&date=${tripDate}`);
if (!Array.isArray(trips) || trips.length === 0) {
  throw new Error("Gateway returned no seeded trips");
}

const booking = await request("POST", "/api/bookings", {
  token,
  body: {
    tripId: seedTripId,
    seatNumber
  }
});

if (!booking.id) {
  throw new Error("Booking response did not include id");
}

const bookings = await request("GET", "/api/bookings/my", { token });
if (!Array.isArray(bookings) || !bookings.some((item) => item.id === booking.id)) {
  throw new Error("Created booking was not found in current user's bookings");
}

const payments = await request("GET", `/api/payments?targetType=BOOKING&targetId=${booking.id}`, { token });
if (!Array.isArray(payments) || payments.length === 0) {
  throw new Error("Booking payment was not found");
}

process.stdout.write(
  `Passenger Gateway smoke passed: booking=${booking.id}, payment=${payments.at(-1).id ?? "unknown"}\n`
);

async function request(method, path, options = {}) {
  const response = await fetch(`${gatewayUrl}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const payload = await parsePayload(response);
  if (!response.ok) {
    const message = payload?.message ?? response.statusText;
    throw new Error(`${method} ${path} failed with ${response.status}: ${message}`);
  }

  return payload;
}

async function parsePayload(response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined;
  }

  return response.json();
}
