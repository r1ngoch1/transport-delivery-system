package com.ringochi.notificationservice;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class PaymentNotificationConsumer {
    private final NotificationProvider notificationProvider;

    public PaymentNotificationConsumer(NotificationProvider notificationProvider) {
        this.notificationProvider = notificationProvider;
    }

    @KafkaListener(topics = "payment-events", groupId = "notification-service")
    public void onPaymentEvent(PaymentEvent event) {
        NotificationMessage message = switch (event.eventType()) {
            case "PaymentSucceeded" -> successMessage(event);
            case "PaymentFailed" -> failedMessage(event);
            default -> null;
        };
        if (message != null) {
            notificationProvider.send(message);
        }
    }

    private NotificationMessage successMessage(PaymentEvent event) {
        return switch (event.targetType()) {
            case "BOOKING" -> new NotificationMessage("LOG", event.userId(), "Booking confirmed",
                    "Booking " + event.targetId() + " payment succeeded.");
            case "CARGO" -> new NotificationMessage("LOG", event.userId(), "Cargo order confirmed",
                    "Cargo order " + event.targetId() + " payment succeeded.");
            default -> null;
        };
    }

    private NotificationMessage failedMessage(PaymentEvent event) {
        return switch (event.targetType()) {
            case "BOOKING" -> new NotificationMessage("LOG", event.userId(), "Booking payment failed",
                    "Booking " + event.targetId() + " payment failed and booking was cancelled.");
            case "CARGO" -> new NotificationMessage("LOG", event.userId(), "Cargo payment failed",
                    "Cargo order " + event.targetId() + " payment failed.");
            default -> null;
        };
    }
}
