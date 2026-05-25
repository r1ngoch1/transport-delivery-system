package com.ringochi.notificationservice;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notifications")
public class Notification {
    @Id
    @Column(name = "id")
    private UUID id = UUID.randomUUID();
    @Column(name = "recipient_user_id")
    private UUID recipientUserId;
    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private NotificationType type;
    @Enumerated(EnumType.STRING)
    @Column(name = "severity")
    private NotificationSeverity severity;
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private NotificationStatus status = NotificationStatus.UNREAD;
    @Column(name = "title")
    private String title;
    @Column(name = "body")
    private String body;
    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type")
    private NotificationEntityType entityType;
    @Column(name = "entity_id")
    private UUID entityId;
    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_channel")
    private NotificationDeliveryChannel deliveryChannel = NotificationDeliveryChannel.IN_APP;
    @Column(name = "event_id")
    private UUID eventId;
    @Column(name = "created_at")
    private Instant createdAt = Instant.now();
    @Column(name = "read_at")
    private Instant readAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getRecipientUserId() {
        return recipientUserId;
    }

    public void setRecipientUserId(UUID recipientUserId) {
        this.recipientUserId = recipientUserId;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public NotificationSeverity getSeverity() {
        return severity;
    }

    public void setSeverity(NotificationSeverity severity) {
        this.severity = severity;
    }

    public NotificationStatus getStatus() {
        return status;
    }

    public void setStatus(NotificationStatus status) {
        this.status = status;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public NotificationEntityType getEntityType() {
        return entityType;
    }

    public void setEntityType(NotificationEntityType entityType) {
        this.entityType = entityType;
    }

    public UUID getEntityId() {
        return entityId;
    }

    public void setEntityId(UUID entityId) {
        this.entityId = entityId;
    }

    public NotificationDeliveryChannel getDeliveryChannel() {
        return deliveryChannel;
    }

    public void setDeliveryChannel(NotificationDeliveryChannel deliveryChannel) {
        this.deliveryChannel = deliveryChannel;
    }

    public UUID getEventId() {
        return eventId;
    }

    public void setEventId(UUID eventId) {
        this.eventId = eventId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getReadAt() {
        return readAt;
    }

    public void setReadAt(Instant readAt) {
        this.readAt = readAt;
    }
}
