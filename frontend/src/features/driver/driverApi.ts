import { apiRequest } from "../../api/http";
import type { components as AdminComponents } from "../../api/generated/admin";

export type DriverProfile = AdminComponents["schemas"]["DriverProfile"];
export type DriverAvailabilityStatus = DriverProfile["availabilityStatus"];

export interface UpdateCurrentDriverProfileRequest {
  availabilityStatus?: DriverAvailabilityStatus;
  licenseCategory?: string;
  licenseExpiresAt?: string;
  licenseNumber?: string;
  phone?: string;
}

export interface CreateCurrentDriverProfileRequest {
  fullName: string;
  licenseCategory: string;
  licenseExpiresAt: string;
  licenseNumber: string;
  phone: string;
}

export interface DriverAvailabilitySlot {
  createdAt: string;
  driverProfileId: string;
  endAt: string;
  id: string;
  note?: string;
  startAt: string;
  updatedAt: string;
}

export interface DriverAvailabilitySlotRequest {
  endAt: string;
  note?: string;
  startAt: string;
}

export function getCurrentDriverProfile(): Promise<DriverProfile> {
  return apiRequest<DriverProfile>("/api/drivers/me");
}

export function createCurrentDriverProfile(
  request: CreateCurrentDriverProfileRequest
): Promise<DriverProfile> {
  return apiRequest<DriverProfile>("/api/drivers/me", {
    method: "POST",
    body: JSON.stringify(request)
  });
}

export function updateCurrentDriverProfile(
  request: UpdateCurrentDriverProfileRequest
): Promise<DriverProfile> {
  return apiRequest<DriverProfile>("/api/drivers/me", {
    method: "PATCH",
    body: JSON.stringify(request)
  });
}

export function getCurrentDriverAvailability(): Promise<DriverAvailabilitySlot[]> {
  return apiRequest<DriverAvailabilitySlot[]>("/api/drivers/me/availability");
}

export function createCurrentDriverAvailabilitySlot(
  request: DriverAvailabilitySlotRequest
): Promise<DriverAvailabilitySlot> {
  return apiRequest<DriverAvailabilitySlot>("/api/drivers/me/availability", {
    method: "POST",
    body: JSON.stringify(request)
  });
}

export function updateCurrentDriverAvailabilitySlot(
  id: string,
  request: DriverAvailabilitySlotRequest
): Promise<DriverAvailabilitySlot> {
  return apiRequest<DriverAvailabilitySlot>(`/api/drivers/me/availability/${id}`, {
    method: "PATCH",
    body: JSON.stringify(request)
  });
}

export function deleteCurrentDriverAvailabilitySlot(id: string): Promise<void> {
  return apiRequest<void>(`/api/drivers/me/availability/${id}`, {
    method: "DELETE"
  });
}
