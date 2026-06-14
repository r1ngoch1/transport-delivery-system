import { apiRequest } from "../../api/http";
import type { components as AdminComponents } from "../../api/generated/admin";
import type { components as RouteComponents } from "../../api/generated/route";
import type { components as TripComponents } from "../../api/generated/trip";

export type AdminUser = AdminComponents["schemas"]["User"];
export type AdminCity = AdminComponents["schemas"]["City"];
export type AdminRoute = AdminComponents["schemas"]["Route"];
export type AdminTrip = AdminComponents["schemas"]["Trip"];
export type AdminBooking = AdminComponents["schemas"]["Booking"];
export type AdminPayment = AdminComponents["schemas"]["Payment"];
export type AdminDriver = AdminComponents["schemas"]["DriverProfile"];
export type AdminCargoOrder = AdminComponents["schemas"]["CargoOrder"] & {
  declaredValue?: number;
  dropoffAddress?: string;
  dropoffCity?: string;
  pickupAddress?: string;
  pickupCity?: string;
  recipientName?: string;
  recipientPhone?: string;
  senderName?: string;
  senderPhone?: string;
};

export type CityRequest = RouteComponents["schemas"]["CityRequest"];
export type RouteRequest = RouteComponents["schemas"]["RouteRequest"];
export type UpdateTripRequest = TripComponents["schemas"]["UpdateTripRequest"];

export interface AdminData {
  users: AdminUser[];
  cities: AdminCity[];
  routes: AdminRoute[];
  trips: AdminTrip[];
  bookings: AdminBooking[];
  payments: AdminPayment[];
  drivers: AdminDriver[];
  cargoOrders: AdminCargoOrder[];
}

export async function getAdminData(): Promise<AdminData> {
  const [users, cities, routes, trips, bookings, payments, drivers, cargoOrders] = await Promise.all([
    apiRequest<AdminUser[]>("/api/admin/users"),
    apiRequest<AdminCity[]>("/api/admin/cities"),
    apiRequest<AdminRoute[]>("/api/admin/routes"),
    apiRequest<AdminTrip[]>("/api/admin/trips"),
    apiRequest<AdminBooking[]>("/api/admin/bookings"),
    apiRequest<AdminPayment[]>("/api/admin/payments"),
    apiRequest<AdminDriver[]>("/api/admin/drivers"),
    apiRequest<AdminCargoOrder[]>("/api/admin/cargo-orders")
  ]);

  return { users, cities, routes, trips, bookings, payments, drivers, cargoOrders };
}

export function createCity(request: CityRequest): Promise<AdminCity> {
  return apiRequest<AdminCity>("/api/cities", {
    method: "POST",
    body: JSON.stringify(request)
  });
}

export function createRoute(request: RouteRequest): Promise<AdminRoute> {
  return apiRequest<AdminRoute>("/api/routes", {
    method: "POST",
    body: JSON.stringify(request)
  });
}

export function updateTrip(id: string, request: UpdateTripRequest): Promise<AdminTrip> {
  return apiRequest<AdminTrip>(`/api/trips/${id}`, {
    method: "PATCH",
    body: JSON.stringify(request)
  });
}

export function cancelAdminCargoOrder(id: string): Promise<AdminCargoOrder> {
  return apiRequest<AdminCargoOrder>(`/api/cargo-orders/admin/${id}/cancel`, {
    method: "POST"
  });
}
