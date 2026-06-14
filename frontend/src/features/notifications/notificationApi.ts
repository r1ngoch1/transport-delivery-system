import { apiRequest } from "../../api/http";

export type NotificationType = "BOOKING" | "CARGO" | "PAYMENT" | "SYSTEM";
export type NotificationSeverity = "INFO" | "SUCCESS" | "WARNING" | "ERROR";
export type NotificationStatus = "UNREAD" | "READ";
export type NotificationEntityType = "BOOKING" | "CARGO_ORDER" | "PAYMENT";
export type NotificationDeliveryChannel = "IN_APP" | "LOG" | "EMAIL" | "SMS";

export interface Notification {
  body: string;
  createdAt: string;
  deliveryChannel: NotificationDeliveryChannel;
  entityId?: string;
  entityType?: NotificationEntityType;
  eventId?: string;
  id: string;
  readAt?: string | null;
  recipientUserId: string;
  severity: NotificationSeverity;
  status: NotificationStatus;
  title: string;
  type: NotificationType;
}

export interface NotificationFilters {
  from?: string;
  severity?: NotificationSeverity;
  status?: NotificationStatus;
  to?: string;
  type?: NotificationType;
}

export async function listNotifications(filters: NotificationFilters = {}): Promise<Notification[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  params.set("page", "0");
  params.set("size", "20");

  const response = await apiRequest<unknown>(`/api/notifications?${params.toString()}`);
  if (!Array.isArray(response)) {
    return [];
  }
  return response
    .filter(isNotification)
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await apiRequest<unknown>("/api/notifications/unread-count");
  if (typeof response === "object" && response !== null && typeof (response as { unreadCount?: unknown }).unreadCount === "number") {
    return (response as { unreadCount: number }).unreadCount;
  }
  return 0;
}

export function markNotificationRead(id: string): Promise<Notification> {
  return apiRequest<Notification>(`/api/notifications/${id}/read`, {
    method: "PATCH"
  });
}

export function markAllNotificationsRead(): Promise<{ updatedCount: number }> {
  return apiRequest<{ updatedCount: number }>("/api/notifications/read-all", {
    method: "PATCH"
  });
}

export function notificationLink(notification: Notification): string {
  if (notification.entityType === "BOOKING" && notification.entityId) {
    return `/bookings?bookingId=${notification.entityId}`;
  }
  if (notification.entityType === "CARGO_ORDER" && notification.entityId) {
    return `/cargo?cargoOrderId=${notification.entityId}`;
  }
  if (notification.entityType === "PAYMENT" && notification.entityId) {
    return `/bookings?paymentId=${notification.entityId}`;
  }
  return "/notifications";
}

function isNotification(value: unknown): value is Notification {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Notification).id === "string" &&
    typeof (value as Notification).title === "string" &&
    typeof (value as Notification).createdAt === "string"
  );
}
