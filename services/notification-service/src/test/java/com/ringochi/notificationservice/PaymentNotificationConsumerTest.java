package com.ringochi.notificationservice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class PaymentNotificationConsumerTest {
    private final CapturingNotificationProvider provider = new CapturingNotificationProvider();
    private final NotificationRepository notifications = org.mockito.Mockito.mock(NotificationRepository.class);
    private final PaymentNotificationConsumer consumer = new PaymentNotificationConsumer(provider, notifications);

    @Test
    void paymentSucceededForBookingStoresBookingConfirmationNotification() {
        UUID targetId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        PaymentEvent event = event("PaymentSucceeded", "BOOKING", targetId, userId);
        when(notifications.findByEventId(event.eventId())).thenReturn(Optional.empty());

        consumer.onPaymentEvent(event);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notifications).save(captor.capture());
        assertThat(captor.getValue()).satisfies(notification -> {
            assertThat(notification.getRecipientUserId()).isEqualTo(userId);
            assertThat(notification.getType()).isEqualTo(NotificationType.BOOKING);
            assertThat(notification.getSeverity()).isEqualTo(NotificationSeverity.SUCCESS);
            assertThat(notification.getStatus()).isEqualTo(NotificationStatus.UNREAD);
            assertThat(notification.getTitle()).isEqualTo("Booking confirmed");
            assertThat(notification.getEntityType()).isEqualTo(NotificationEntityType.BOOKING);
            assertThat(notification.getEntityId()).isEqualTo(targetId);
            assertThat(notification.getEventId()).isEqualTo(event.eventId());
        });
        assertThat(provider.messages).singleElement().satisfies(message -> {
            assertThat(message.channel()).isEqualTo("LOG");
            assertThat(message.recipientUserId()).isEqualTo(userId);
            assertThat(message.subject()).isEqualTo("Booking confirmed");
            assertThat(message.body()).contains(targetId.toString()).contains("payment succeeded");
        });
    }

    @Test
    void paymentFailedForBookingSendsBookingCancellationNotification() {
        UUID targetId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        PaymentEvent event = event("PaymentFailed", "BOOKING", targetId, userId);
        when(notifications.findByEventId(event.eventId())).thenReturn(Optional.empty());

        consumer.onPaymentEvent(event);

        assertThat(provider.messages).singleElement().satisfies(message -> {
            assertThat(message.recipientUserId()).isEqualTo(userId);
            assertThat(message.subject()).isEqualTo("Booking payment failed");
            assertThat(message.body()).contains(targetId.toString()).contains("booking was cancelled");
        });
        verify(notifications).save(any(Notification.class));
    }

    @Test
    void paymentSucceededForCargoSendsCargoConfirmationNotification() {
        UUID targetId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        PaymentEvent event = event("PaymentSucceeded", "CARGO", targetId, userId);
        when(notifications.findByEventId(event.eventId())).thenReturn(Optional.empty());

        consumer.onPaymentEvent(event);

        assertThat(provider.messages).singleElement().satisfies(message -> {
            assertThat(message.recipientUserId()).isEqualTo(userId);
            assertThat(message.subject()).isEqualTo("Cargo order paid");
            assertThat(message.body()).contains(targetId.toString()).contains("payment succeeded");
        });
        verify(notifications).save(any(Notification.class));
    }

    @Test
    void duplicatePaymentEventIsIgnored() {
        PaymentEvent event = event("PaymentSucceeded", "BOOKING", UUID.randomUUID(), UUID.randomUUID());
        when(notifications.findByEventId(event.eventId())).thenReturn(Optional.of(new Notification()));

        consumer.onPaymentEvent(event);

        verify(notifications, never()).save(any(Notification.class));
        assertThat(provider.messages).isEmpty();
    }

    @Test
    void unsupportedEventsAreIgnored() {
        consumer.onPaymentEvent(event("PaymentRefunded", "BOOKING", UUID.randomUUID(), UUID.randomUUID()));
        consumer.onPaymentEvent(event("PaymentSucceeded", "OTHER", UUID.randomUUID(), UUID.randomUUID()));

        assertThat(provider.messages).isEmpty();
    }

    private PaymentEvent event(String eventType, String targetType, UUID targetId, UUID userId) {
        return new PaymentEvent(UUID.randomUUID(), eventType, UUID.randomUUID(), targetType, targetId,
                userId, BigDecimal.valueOf(1200), Instant.parse("2026-05-22T10:00:00Z"));
    }

    private static class CapturingNotificationProvider implements NotificationProvider {
        private final List<NotificationMessage> messages = new ArrayList<>();

        @Override
        public void send(NotificationMessage message) {
            messages.add(message);
        }
    }
}
