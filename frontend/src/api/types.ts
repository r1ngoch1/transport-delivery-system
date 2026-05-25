export type UserRole = "PASSENGER" | "DRIVER" | "ADMIN";

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

export type TripStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type CargoStatus = "PENDING_PAYMENT" | "PAID" | "CANCELLED";

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType?: string;
  user?: User;
}

export interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  roles: UserRole[];
}

export interface City {
  id: string;
  name: string;
  region: string;
  country: string;
  active: boolean;
}

export interface Route {
  id: string;
  fromCityId: string;
  toCityId: string;
  distanceKm: number;
  active: boolean;
}

export interface Trip {
  id: string;
  routeId: string;
  departureTime: string;
  arrivalTime: string;
  status: TripStatus;
  capacity: number;
  availableSeats: number;
  price: number;
}

export interface Booking {
  id: string;
  userId: string;
  tripId: string;
  seatNumber: string;
  status: BookingStatus;
  createdAt: string;
}

export interface Payment {
  id: string;
  targetType: "BOOKING" | "CARGO";
  targetId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
}
