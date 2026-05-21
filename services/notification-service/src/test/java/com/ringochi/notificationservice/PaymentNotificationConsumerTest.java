package com.ringochi.notificationservice;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class PaymentNotificationConsumerTest {
    private final CapturingNotificationProvider provider = new CapturingNotificationProvider();
    private final PaymentNotificationConsumer consumer = new PaymentNotificationConsumer(provider);

    @Test
    void paymentSucceededForBookingSendsBookingConfirmationNotification() {
        UUID targetId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        consumer.onPaymentEvent(event("PaymentSucceeded", "BOOKING", targetId, userId));

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

        consumer.onPaymentEvent(event("PaymentFailed", "BOOKING", targetId, userId));

        assertThat(provider.messages).singleElement().satisfies(message -> {
            assertThat(message.recipientUserId()).isEqualTo(userId);
            assertThat(message.subject()).isEqualTo("Booking payment failed");
            assertThat(message.body()).contains(targetId.toString()).contains("booking was cancelled");
        });
    }

    @Test
    void paymentSucceededForCargoSendsCargoConfirmationNotification() {
        UUID targetId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        consumer.onPaymentEvent(event("PaymentSucceeded", "CARGO", targetId, userId));

        assertThat(provider.messages).singleElement().satisfies(message -> {
            assertThat(message.recipientUserId()).isEqualTo(userId);
            assertThat(message.subject()).isEqualTo("Cargo order confirmed");
            assertThat(message.body()).contains(targetId.toString()).contains("payment succeeded");
        });
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
