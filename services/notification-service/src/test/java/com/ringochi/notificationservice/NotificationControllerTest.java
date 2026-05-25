package com.ringochi.notificationservice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.server.ResponseStatusException;

class NotificationControllerTest {
    private final NotificationRepository notifications = org.mockito.Mockito.mock(NotificationRepository.class);
    private final NotificationController controller = new NotificationController(notifications);

    @Test
    void listsCurrentUserNotificationsWithFilters() {
        UUID userId = UUID.randomUUID();
        Notification notification = notification(userId, NotificationStatus.UNREAD);
        when(notifications.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(notification)));

        List<Notification> result = controller.list(userId, "PASSENGER", NotificationType.BOOKING,
                NotificationStatus.UNREAD, NotificationSeverity.SUCCESS, Instant.parse("2026-05-01T00:00:00Z"),
                Instant.parse("2026-05-31T23:59:59Z"), 0, 20);

        assertThat(result).containsExactly(notification);
    }

    @Test
    void returnsUnreadCountForCurrentUser() {
        UUID userId = UUID.randomUUID();
        when(notifications.countByRecipientUserIdAndStatus(userId, NotificationStatus.UNREAD)).thenReturn(3L);

        assertThat(controller.unreadCount(userId).get("unreadCount")).isEqualTo(3L);
    }

    @Test
    void marksCurrentUserNotificationAsRead() {
        UUID userId = UUID.randomUUID();
        Notification notification = notification(userId, NotificationStatus.UNREAD);
        when(notifications.findById(notification.getId())).thenReturn(Optional.of(notification));
        when(notifications.save(notification)).thenReturn(notification);

        Notification result = controller.markRead(userId, notification.getId());

        assertThat(result.getStatus()).isEqualTo(NotificationStatus.READ);
        assertThat(result.getReadAt()).isNotNull();
        verify(notifications).save(notification);
    }

    @Test
    void rejectsReadingAnotherUsersNotification() {
        Notification notification = notification(UUID.randomUUID(), NotificationStatus.UNREAD);
        when(notifications.findById(notification.getId())).thenReturn(Optional.of(notification));

        assertThatThrownBy(() -> controller.markRead(UUID.randomUUID(), notification.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Cannot access another user's notification");
    }

    @Test
    void marksAllCurrentUserNotificationsAsRead() {
        UUID userId = UUID.randomUUID();
        Notification first = notification(userId, NotificationStatus.UNREAD);
        Notification second = notification(userId, NotificationStatus.UNREAD);
        when(notifications.findByRecipientUserIdAndStatus(userId, NotificationStatus.UNREAD))
                .thenReturn(List.of(first, second));

        assertThat(controller.markAllRead(userId).get("updatedCount")).isEqualTo(2);

        assertThat(first.getStatus()).isEqualTo(NotificationStatus.READ);
        assertThat(second.getStatus()).isEqualTo(NotificationStatus.READ);
        verify(notifications).saveAll(List.of(first, second));
    }

    private Notification notification(UUID userId, NotificationStatus status) {
        Notification notification = new Notification();
        notification.setRecipientUserId(userId);
        notification.setType(NotificationType.BOOKING);
        notification.setSeverity(NotificationSeverity.SUCCESS);
        notification.setStatus(status);
        notification.setTitle("Booking confirmed");
        notification.setBody("Booking payment succeeded.");
        notification.setEntityType(NotificationEntityType.BOOKING);
        notification.setEntityId(UUID.randomUUID());
        notification.setDeliveryChannel(NotificationDeliveryChannel.IN_APP);
        return notification;
    }
}
