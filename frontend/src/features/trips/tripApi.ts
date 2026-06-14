import { tripClient } from "../../api/generated/client";
import type { components } from "../../api/generated/trip";
import { apiRequest } from "../../api/http";
import { formatApiError } from "../../shared/errors/apiError";

export type Trip = components["schemas"]["Trip"];
export type CreateTripRequest = components["schemas"]["TripRequest"];

export async function listTrips(params: { driverId?: string; status?: Trip["status"] } = {}): Promise<Trip[]> {
  const search = new URLSearchParams();
  if (params.driverId) {
    search.set("driverId", params.driverId);
  }
  if (params.status) {
    search.set("status", params.status);
  }
  const queryString = search.toString();
  return apiRequest<Trip[]>(`/api/trips${queryString ? `?${queryString}` : ""}`);
}

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
    throw new Error(formatApiError(error, "Could not search trips"));
  }

  return result.data ?? [];
}

export function createTrip(request: CreateTripRequest): Promise<Trip> {
  return apiRequest<Trip>("/api/trips", {
    method: "POST",
    body: JSON.stringify(request)
  });
}
