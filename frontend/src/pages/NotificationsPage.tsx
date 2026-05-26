import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationLink,
  type NotificationStatus,
  type NotificationType
} from "../features/notifications/notificationApi";
import { ApiErrorMessage } from "../shared/ui/ApiErrorMessage";
import { Button } from "../shared/ui/Button";
import { DataPanel } from "../shared/ui/DataPanel";
import { ListRow } from "../shared/ui/ListRow";
import { PageHeader } from "../shared/ui/PageHeader";
import { ScreenState } from "../shared/ui/ScreenState";
import { StatusChip } from "../shared/ui/StatusChip";

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"" | NotificationStatus>("");
  const [type, setType] = useState<"" | NotificationType>("");
  const [notice, setNotice] = useState("");
  const notificationsQuery = useQuery({
    queryKey: ["notifications", "all", status, type],
    queryFn: () =>
      listNotifications({
        status: status || undefined,
        type: type || undefined
      })
  });
  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess() {
      setNotice("All notifications marked as read");
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  return (
    <main className="page">
      <DataPanel className="notification-page">
        <PageHeader
          eyebrow="Notifications"
          title="All notifications"
          subtitle="Booking, cargo, and payment events delivered through Notification Service."
        >
          <Button type="button" variant="secondary" onClick={() => readAllMutation.mutate()}>
            Mark all as read
          </Button>
        </PageHeader>
        {notice && <div className="notice">{notice}</div>}
        <div className="notification-filters">
          <label>
            Notification status
            <select value={status} onChange={(event) => setStatus(event.target.value as "" | NotificationStatus)}>
              <option value="">Any status</option>
              <option value="UNREAD">Unread</option>
              <option value="READ">Read</option>
            </select>
          </label>
          <label>
            Notification type
            <select value={type} onChange={(event) => setType(event.target.value as "" | NotificationType)}>
              <option value="">Any type</option>
              <option value="BOOKING">Booking</option>
              <option value="CARGO">Cargo</option>
              <option value="PAYMENT">Payment</option>
              <option value="SYSTEM">System</option>
            </select>
          </label>
        </div>
        {notificationsQuery.isLoading && (
          <ScreenState className="catalog-state booking-state" kind="loading" message="Loading notifications" />
        )}
        {notificationsQuery.isError && (
          <ApiErrorMessage
            className="form-error booking-state"
            error={notificationsQuery.error}
            fallback="Could not load notifications"
          />
        )}
        {readMutation.isError && (
          <ApiErrorMessage className="form-error booking-state" error={readMutation.error} fallback="Could not mark notification as read" />
        )}
        {notificationsQuery.isSuccess && notificationsQuery.data.length === 0 && (
          <ScreenState className="catalog-state booking-state" kind="empty" message="No notifications" />
        )}
        {notificationsQuery.isSuccess && notificationsQuery.data.length > 0 && (
          <div className="notification-list">
            {notificationsQuery.data.map((notification) => (
              <ListRow
                key={notification.id}
                title={notification.title}
                meta={notification.body}
                aside={
                  <>
                    <StatusChip status={notification.status === "UNREAD" ? "PENDING" : "COMPLETED"} label={notification.status} />
                    <div className="inline-actions">
                      <Link className="inline-link" to={notificationLink(notification)}>
                        Open linked item
                      </Link>
                      {notification.status === "UNREAD" && (
                        <button
                          className="inline-link inline-button"
                          type="button"
                          onClick={() => readMutation.mutate(notification.id)}
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </>
                }
              >
                {new Date(notification.createdAt).toLocaleString()}
              </ListRow>
            ))}
          </div>
        )}
      </DataPanel>
    </main>
  );
}
