import { paymentClient } from "../../api/generated/client";
import type { components } from "../../api/generated/payment";
import { formatApiError } from "../../shared/errors/apiError";

export type Payment = components["schemas"]["Payment"];
export type PaymentStatus = components["schemas"]["PaymentStatus"];

export async function findBookingPayments(bookingId: string): Promise<Payment[]> {
  const result = await paymentClient.GET("/api/payments", {
    params: {
      query: {
        targetType: "BOOKING",
        targetId: bookingId
      }
    }
  });

  const error = (result as { error?: unknown }).error;
  if (error) {
    throw new Error(formatApiError(error, "Could not load payment status"));
  }

  return result.data ?? [];
}

export async function findCargoPayments(cargoOrderId: string): Promise<Payment[]> {
  const result = await paymentClient.GET("/api/payments", {
    params: {
      query: {
        targetType: "CARGO_ORDER",
        targetId: cargoOrderId
      }
    }
  });

  const error = (result as { error?: unknown }).error;
  if (error) {
    throw new Error(formatApiError(error, "Could not load payment status"));
  }

  return result.data ?? [];
}
