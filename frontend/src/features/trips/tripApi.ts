import { tripClient } from "../../api/generated/client";
import type { components } from "../../api/generated/trip";

export type Trip = components["schemas"]["Trip"];

export async function searchTrips(routeId: string, date?: string): Promise<Trip[]> {
  const result = await tripClient.GET("/api/trips/search", {
    params: {
      query: {
        routeId,
        ...(date ? { date } : {})
      }
    }
  });

  const error = (result as { error?: unknown }).error;
  if (error) {
    throw new Error(extractErrorMessage(error, "Could not search trips"));
  }

  return result.data ?? [];
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error && "message" in error) {
    return String(error.message);
  }
  return fallback;
}
