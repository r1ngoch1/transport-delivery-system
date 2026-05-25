import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  getUnreadNotificationCount,
  listNotifications,
  markNotificationRead,
  notificationLink,
  type Notification
} from "./notificationApi";
import { ApiErrorMessage } from "../../shared/ui/ApiErrorMessage";
import { ScreenState } from "../../shared/ui/ScreenState";
import { StatusChip } from "../../shared/ui/StatusChip";

interface NotificationCenterProps {
  enabled: boolean;
}

export function NotificationCenter({ enabled }: NotificationCenterProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const unreadCountQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: getUnreadNotificationCount,
    enabled,
    refetchInterval: enabled ? 30_000 : false
  });
  const notificationsQuery = useQuery({
    queryKey: ["notifications", "latest"],
    queryFn: () => listNotifications(),
    enabled,
    refetchInterval: enabled ? 30_000 : false
  });
  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const unreadCount = unreadCountQuery.data ?? 0;
  const latestNotifications = notificationsQuery.data ?? [];
  const toastNotification = useMemo(
    () => latestNotifications.find((notification) => notification.status === "UNREAD" && isImportant(notification)),
    [latestNotifications]
  );

  if (!enabled) {
    return null;
  }

  return (
    <div className="notification-shell">
      <button
        className="nav-button notification-button"
        type="button"
        aria-label={`Notifications ${unreadCount} unread`}
        onClick={() => setOpen((current) => !current)}
      >
        Notifications
        <span className="notification-badge">{unreadCount}</span>
      </button>
      {open && (
        <section className="notification-popover panel" aria-label="Notification center">
          <div className="notification-header">
            <h2>Notifications</h2>
            <Link className="inline-link" to="/notifications">
              View all
            </Link>
          </div>
          {notificationsQuery.isLoading && (
            <ScreenState className="catalog-state" inline kind="loading" message="Loading notifications" />
          )}
          {notificationsQuery.isError && (
            <ApiErrorMessage error={notificationsQuery.error} fallback="Could not load notifications" />
          )}
          {notificationsQuery.isSuccess && latestNotifications.length === 0 && (
            <ScreenState className="catalog-state" inline kind="empty" message="No notifications" />
          )}
          {latestNotifications.slice(0, 5).map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={() => readMutation.mutate(notification.id)}
            />
          ))}
        </section>
      )}
      {toastNotification && (
        <div className={`notification-toast toast-${toastNotification.severity.toLowerCase()}`} role="status" aria-label="notification toast">
          <strong>{toastNotification.title}</strong>
          <span>{toastNotification.body}</span>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkRead
}: {
  notification: Notification;
  onMarkRead: () => void;
}) {
  return (
    <article className="notification-item">
      <div className="notification-copy">
        <strong>{notification.title}</strong>
        <span>{notification.body}</span>
        <span>{new Date(notification.createdAt).toLocaleString()}</span>
      </div>
      <StatusChip status={notification.status === "UNREAD" ? "PENDING" : "COMPLETED"} label={notification.status} />
      <div className="inline-actions">
        <Link className="inline-link" to={notificationLink(notification)} aria-label={`Open ${notification.title}`}>
          Open
        </Link>
        {notification.status === "UNREAD" && (
          <button className="inline-link inline-button" type="button" onClick={onMarkRead} aria-label={`Mark ${notification.title} as read`}>
            Mark read
          </button>
        )}
      </div>
    </article>
  );
}

function isImportant(notification: Notification) {
  return notification.severity === "SUCCESS" || notification.severity === "ERROR";
}
