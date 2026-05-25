import { apiRequest } from "../../api/http";

export interface CreateCargoOrderRequest {
  declaredValue?: number;
  description: string;
  dropoffAddress?: string;
  dropoffCity?: string;
  heightCm: number;
  lengthCm: number;
  pickupAddress?: string;
  pickupCity?: string;
  recipientName?: string;
  recipientPhone?: string;
  senderName?: string;
  senderPhone?: string;
  tripId: string;
  weightKg: number;
  widthCm: number;
}

export interface CargoOrder extends CreateCargoOrderRequest {
  createdAt: string;
  currency: string;
  id: string;
  paymentId?: string;
  price: number;
  status: "PENDING_PAYMENT" | "PAID" | "CANCELLED";
  updatedAt: string;
  userId: string;
  volumeM3: number;
}

export function createCargoOrder(request: CreateCargoOrderRequest): Promise<CargoOrder> {
  return apiRequest<CargoOrder>("/api/cargo-orders", {
    method: "POST",
    body: JSON.stringify(request)
  });
}

export function listMyCargoOrders(): Promise<CargoOrder[]> {
  return apiRequest<CargoOrder[]>("/api/cargo-orders/my");
}

export function cancelCargoOrder(id: string): Promise<CargoOrder> {
  return apiRequest<CargoOrder>(`/api/cargo-orders/${id}/cancel`, {
    method: "POST"
  });
}
