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
import { useI18n } from "../shared/i18n/i18n";
import { ApiErrorMessage } from "../shared/ui/ApiErrorMessage";
import { Button } from "../shared/ui/Button";
import { DataPanel } from "../shared/ui/DataPanel";
import { ListRow } from "../shared/ui/ListRow";
import { PageHeader } from "../shared/ui/PageHeader";
import { ScreenState } from "../shared/ui/ScreenState";
import { StatusChip } from "../shared/ui/StatusChip";

export function NotificationsPage() {
  const { t } = useI18n();
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
      setNotice(t("All notifications marked as read"));
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  return (
    <main className="page">
      <DataPanel className="notification-page">
        <PageHeader
          eyebrow={t("Notifications")}
          title={t("All notifications")}
          subtitle={t("Booking, cargo, and payment events delivered through Notification Service.")}
        >
          <Button type="button" variant="secondary" onClick={() => readAllMutation.mutate()}>
            {t("Mark all as read")}
          </Button>
        </PageHeader>
        {notice && <div className="notice">{notice}</div>}
        <div className="notification-filters">
          <label>
            {t("Notification status")}
            <select value={status} onChange={(event) => setStatus(event.target.value as "" | NotificationStatus)}>
              <option value="">{t("Any status")}</option>
              <option value="UNREAD">{t("Unread")}</option>
              <option value="READ">{t("Read")}</option>
            </select>
          </label>
          <label>
            {t("Notification type")}
            <select value={type} onChange={(event) => setType(event.target.value as "" | NotificationType)}>
              <option value="">{t("Any type")}</option>
              <option value="BOOKING">{t("Booking")}</option>
              <option value="CARGO">{t("Cargo")}</option>
              <option value="PAYMENT">{t("Payment")}</option>
              <option value="SYSTEM">{t("System")}</option>
            </select>
          </label>
        </div>
        {notificationsQuery.isLoading && (
          <ScreenState className="catalog-state booking-state" kind="loading" message={t("Loading notifications")} />
        )}
        {notificationsQuery.isError && (
          <ApiErrorMessage
            className="form-error booking-state"
            error={notificationsQuery.error}
            fallback={t("Could not load notifications")}
          />
        )}
        {readMutation.isError && (
          <ApiErrorMessage className="form-error booking-state" error={readMutation.error} fallback={t("Could not mark notification as read")} />
        )}
        {notificationsQuery.isSuccess && notificationsQuery.data.length === 0 && (
          <ScreenState className="catalog-state booking-state" kind="empty" message={t("No notifications")} />
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
                        {t("Open linked item")}
                      </Link>
                      {notification.status === "UNREAD" && (
                        <button
                          className="inline-link inline-button"
                          type="button"
                          onClick={() => readMutation.mutate(notification.id)}
                        >
                          {t("Mark read")}
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
