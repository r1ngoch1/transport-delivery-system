import { describe, expect, it } from "vitest";
import type { components as UserComponents } from "./user";
import type { components as BookingComponents } from "./booking";

describe("generated OpenAPI types", () => {
  it("exposes user and booking schemas", () => {
    const user: UserComponents["schemas"]["User"] = {
      id: "user-id",
      email: "passenger@example.com",
      phone: "+79990000000",
      fullName: "Passenger",
      enabled: true,
      roles: ["PASSENGER"],
      createdAt: "2026-05-22T00:00:00Z",
      updatedAt: "2026-05-22T00:00:00Z"
    };
    const booking: BookingComponents["schemas"]["Booking"] = {
      id: "booking-id",
      userId: "user-id",
      tripId: "trip-id",
      seatNumber: "1",
      status: "PENDING",
      price: 1200,
      createdAt: "2026-05-22T00:00:00Z",
      updatedAt: "2026-05-22T00:00:00Z"
    };

    expect(user.roles).toContain("PASSENGER");
    expect(booking.status).toBe("PENDING");
  });
});
