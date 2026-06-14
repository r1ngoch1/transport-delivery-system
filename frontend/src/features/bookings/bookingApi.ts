import { bookingClient } from "../../api/generated/client";
import type { components } from "../../api/generated/booking";
import { formatApiError } from "../../shared/errors/apiError";

export type Booking = components["schemas"]["Booking"];

export async function createBooking(tripId: string, seatNumber: string): Promise<Booking> {
  const result = await bookingClient.POST("/api/bookings", {
    body: {
      tripId,
      seatNumber
    }
  });

  const error = (result as { error?: unknown }).error;
  if (error) {
    throw new Error(formatApiError(error, "Could not create booking"));
  }
  if (!result.data) {
    throw new Error("Could not create booking");
  }

  return result.data;
}

export async function listMyBookings(): Promise<Booking[]> {
  const result = await bookingClient.GET("/api/bookings/my");

  const error = (result as { error?: unknown }).error;
  if (error) {
    throw new Error(formatApiError(error, "Could not load bookings"));
  }

  return result.data ?? [];
}
