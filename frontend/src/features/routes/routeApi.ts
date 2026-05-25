import { routeClient } from "../../api/generated/client";
import type { components } from "../../api/generated/route";
import { formatApiError } from "../../shared/errors/apiError";

export type City = components["schemas"]["City"];
export type Route = components["schemas"]["Route"];

export interface RouteCatalog {
  cities: City[];
  routes: Route[];
}

export async function getRouteCatalog(): Promise<RouteCatalog> {
  const [citiesResult, routesResult] = await Promise.all([
    routeClient.GET("/api/cities"),
    routeClient.GET("/api/routes")
  ]);

  const citiesError = (citiesResult as { error?: unknown }).error;
  const routesError = (routesResult as { error?: unknown }).error;

  if (citiesError) {
    throw new Error(formatApiError(citiesError, "Could not load cities"));
  }
  if (routesError) {
    throw new Error(formatApiError(routesError, "Could not load routes"));
  }

  return {
    cities: citiesResult.data ?? [],
    routes: routesResult.data ?? []
  };
}

export function getCityName(cities: Array<{ id: string; name?: string }>, cityId: string | undefined) {
  if (!cityId) {
    return "Unknown city";
  }
  return cities.find((city) => city.id === cityId)?.name ?? "Unknown city";
}

