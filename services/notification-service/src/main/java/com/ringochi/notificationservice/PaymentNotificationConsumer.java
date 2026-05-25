package com.ringochi.notificationservice;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class PaymentNotificationConsumer {
    private final NotificationProvider notificationProvider;
    private final NotificationRepository notifications;

    public PaymentNotificationConsumer(NotificationProvider notificationProvider, NotificationRepository notifications) {
        this.notificationProvider = notificationProvider;
        this.notifications = notifications;
    }

    @KafkaListener(topics = "payment-events", groupId = "notification-service")
    public void onPaymentEvent(PaymentEvent event) {
        if (notifications.findByEventId(event.eventId()).isPresent()) {
            return;
        }
        Notification notification = switch (event.eventType()) {
            case "PaymentSucceeded" -> successNotification(event);
            case "PaymentFailed" -> failedNotification(event);
            default -> null;
        };
        if (notification != null) {
            notifications.save(notification);
            notificationProvider.send(toMessage(notification));
        }
    }

    private Notification successNotification(PaymentEvent event) {
        return switch (event.targetType()) {
            case "BOOKING" -> notification(event, NotificationType.BOOKING, NotificationSeverity.SUCCESS,
                    "Booking confirmed", "Booking " + event.targetId() + " payment succeeded.",
                    NotificationEntityType.BOOKING);
            case "CARGO" -> notification(event, NotificationType.CARGO, NotificationSeverity.SUCCESS,
                    "Cargo order paid", "Cargo order " + event.targetId() + " payment succeeded.",
                    NotificationEntityType.CARGO_ORDER);
            default -> null;
        };
    }

    private Notification failedNotification(PaymentEvent event) {
        return switch (event.targetType()) {
            case "BOOKING" -> notification(event, NotificationType.PAYMENT, NotificationSeverity.ERROR,
                    "Booking payment failed", "Booking " + event.targetId() + " payment failed and booking was cancelled.",
                    NotificationEntityType.BOOKING);
            case "CARGO" -> notification(event, NotificationType.PAYMENT, NotificationSeverity.ERROR,
                    "Cargo payment failed", "Cargo order " + event.targetId() + " payment failed.",
                    NotificationEntityType.CARGO_ORDER);
            default -> null;
        };
    }

    private Notification notification(PaymentEvent event, NotificationType type, NotificationSeverity severity,
                                      String title, String body, NotificationEntityType entityType) {
        Notification notification = new Notification();
        notification.setRecipientUserId(event.userId());
        notification.setType(type);
        notification.setSeverity(severity);
        notification.setStatus(NotificationStatus.UNREAD);
        notification.setTitle(title);
        notification.setBody(body);
        notification.setEntityType(entityType);
        notification.setEntityId(event.targetId());
        notification.setDeliveryChannel(NotificationDeliveryChannel.IN_APP);
        notification.setEventId(event.eventId());
        notification.setCreatedAt(event.occurredAt());
        return notification;
    }

    private NotificationMessage toMessage(Notification notification) {
        return new NotificationMessage("LOG", notification.getRecipientUserId(), notification.getTitle(),
                notification.getBody());
    }
}
